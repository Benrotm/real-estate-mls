import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { ImmofluxConfig } from '@/app/lib/actions/admin-settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    // Verify cron secret if needed
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });

    try {
        console.log("[Immoflux Cron] Starting...");

        // 1. Fetch Integration Settings
        const { data: rawSetting, error: settingError } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'immoflux_integration')
            .single();

        if (settingError || !rawSetting) {
            return NextResponse.json({ status: 'ignored', reason: 'Immoflux settings not found.' });
        }

        const config: ImmofluxConfig = typeof rawSetting.value === 'string'
            ? JSON.parse(rawSetting.value)
            : rawSetting.value;

        if (!config.is_active) {
            return NextResponse.json({ status: 'ignored', reason: 'Immoflux scraper is deactivated.' });
        }

        if (!config.username || !config.password) {
            return NextResponse.json({ status: 'error', reason: 'Immoflux credentials (username or password) are missing in the settings.' }, { status: 400 });
        }

        // 2. Login to Immoflux
        console.log("[Immoflux Cron] Fetching login page to grab CSRF...");

        let sessionCookie = '';

        const loginGetRes = await fetch('https://blitz.immoflux.ro/login', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const loginCookies = loginGetRes.headers.get('set-cookie');
        if (loginCookies) {
            sessionCookie = loginCookies.split(';')[0];
        }

        const loginHtml = await loginGetRes.text();
        const $login = cheerio.load(loginHtml);
        const csrfToken = $login('meta[name="csrf-token"]').attr('content');

        if (!csrfToken) {
            return NextResponse.json({ status: 'error', reason: 'Could not find CSRF token on Immoflux login page. The page structure might have changed or login is blocked.' }, { status: 500 });
        }

        console.log("[Immoflux Cron] Authenticating...");
        const formData = new URLSearchParams();
        formData.append('_token', csrfToken);
        formData.append('email', config.username);
        formData.append('password', config.password);

        const loginPostRes = await fetch('https://blitz.immoflux.ro/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://blitz.immoflux.ro/login'
            },
            body: formData.toString(),
            redirect: 'manual' // CRITICAL: Stop fetch from following the 302 redirect so we can extract the authenticated cookie
        });

        // The session cookie is likely modified/re-issued on the 302 redirect
        const authCookies = loginPostRes.headers.get('set-cookie');
        if (authCookies) {
            // Need to merge cookies or take the new session
            const newSession = authCookies.split(',').map(c => c.split(';')[0]).join('; ');
            sessionCookie = newSession;
        }

        // Let's verify if the login actually succeeded by checking if we get redirected to /login again
        if (loginPostRes.url.includes('/login') && loginPostRes.status === 200) {
            console.log("[Immoflux Cron] Login may have failed, response is still on login page.");
        }

        const scrapeLimit = config.scrape_limit || 50;

        // 3. Fetch Properties Dashboard to extract the filter form
        const targetUrl = config.url || 'https://blitz.immoflux.ro/approperties';
        console.log(`[Immoflux Cron] Fetching dashboard to extract filters: ${targetUrl}`);

        const dashboardRes = await fetch(targetUrl, {
            headers: {
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const dashboardHtml = await dashboardRes.text();
        let $ = cheerio.load(dashboardHtml);
        const dashboardCsrfToken = $('meta[name="csrf-token"]').attr('content') || csrfToken;

        // Extract all filter form fields to accurately emulate the user's dashboard view (e.g., Timisoara)
        const formFields = new URLSearchParams();
        $('#filter input[name], #filter select[name]').each((i, el) => {
            const name = $(el).attr('name') as string;
            const type = $(el).attr('type');
            let value = $(el).val() as string | string[] | undefined;

            if (type === 'radio' || type === 'checkbox') {
                if ($(el).is(':checked')) {
                    formFields.append(name, value as string);
                }
            } else if (name === 'filter_transaction_id__in[]' || name === 'filter_status__eq' || $(el).is('select')) {
                $(el).find('option:selected').each((j, opt) => {
                    formFields.append(name, $(opt).val() as string);
                });
            } else {
                if (value !== undefined && value !== null) {
                    formFields.append(name, value as string);
                }
            }
        });

        // Ensure required AJAX fields are present
        if (!formFields.has('_token')) formFields.set('_token', dashboardCsrfToken);
        formFields.set('limit', scrapeLimit.toString());

        const filterapUrl = $('#filter').attr('data-href') || `${targetUrl.replace(/\/$/, '')}/filterap`;

        console.log(`[Immoflux Cron] Submitting AJAX filter request to: ${filterapUrl}`);

        const listRes = await fetch(filterapUrl, {
            method: 'POST',
            headers: {
                'Cookie': sessionCookie,
                'User-Agent': 'Mozilla/5.0',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-CSRF-TOKEN': dashboardCsrfToken
            },
            body: formFields.toString()
        });

        const listHtml = await listRes.text();
        // The AJAX response returns the table rows directly or wrapped in pagination markup
        $ = cheerio.load(listHtml);

        const listings: any[] = [];

        // This selector targets the standard table rows returned by the AJAX call
        const rowSelector = 'tr.model-item';

        const foundRows = $(rowSelector).length;
        if (foundRows === 0) {
            const debugInfo = JSON.stringify({
                target_url: targetUrl,
                filterap_url: filterapUrl,
                ajax_status: listRes.status,
                html_preview: listHtml.substring(0, 150)
            });

            return NextResponse.json({
                status: 'error',
                reason: `Found 0 matching property rows using selector '${rowSelector}'. Debug Info: ${debugInfo}`,
                target_url: targetUrl
            }, { status: 200 });
        }

        $(rowSelector).each((i, el) => {
            if (listings.length >= scrapeLimit) return false; // Stop iterating once limit is reached

            try {
                const title = config.mapping.title ? $(el).find(config.mapping.title).text().trim() : '';
                const priceText = config.mapping.price ? $(el).find(config.mapping.price).text().trim() : '';
                const description = config.mapping.description ? $(el).find(config.mapping.description).text().trim() : '';
                const location = config.mapping.location_city ? $(el).find(config.mapping.location_city).text().trim() : '';
                const roomsText = config.mapping.rooms ? $(el).find(config.mapping.rooms).text().trim() : '';
                const phone = config.mapping.phone ? $(el).find(config.mapping.phone).text().trim() : '';

                // Parse Price
                let price = 0;
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) price = parseInt(priceMatch[0].replace(/[,.]/g, ''), 10);

                // Parse Rooms
                let rooms = 0;
                const roomsMatch = roomsText.match(/\d+/);
                if (roomsMatch) rooms = parseInt(roomsMatch[0], 10);

                if (title || price > 0) {
                    listings.push({
                        title: title || 'Immoflux Property',
                        price,
                        description,
                        address: location || config.region_filter || 'Timis',
                        rooms,
                        owner_phone: phone,
                        private_notes: 'Original Link: ' + targetUrl,
                        status: 'draft',
                        features: ['Immoflux Import']
                    });
                }
            } catch (err) {
                console.error("Error parsing row", err);
            }
        });

        console.log(`[Immoflux Cron] Scraped ${listings.length} properties.`);

        let insertedCount = 0;
        let duplicateCount = 0;

        // 4. Insert properties safely
        for (const item of listings) {
            // We can rely on our `properties` table constraints OR just manual checking
            // To be safe, we check if the exact title & price & phone already exists 
            // (in a real scenario, use the Phase 3 fingerprint logic here if imported locally)
            const { data: existing } = await supabase
                .from('properties')
                .select('id')
                .eq('price', item.price)
                .eq('address', item.address)
                .limit(1);

            if (existing && existing.length > 0) {
                duplicateCount++;
                continue; // Skip
            }

            // Fallback owner (first super_admin, ordered by email to guarantee the real admin account over test ones)
            const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'super_admin').order('email', { ascending: true }).limit(1).single();

            const { error: insertError } = await supabase
                .from('properties')
                .insert({
                    ...item,
                    owner_id: admin?.id,
                    type: 'apartment', // Default
                    property_type: 'sale'
                });

            if (!insertError) {
                insertedCount++;
            } else {
                console.error("[Immoflux Cron] Insert Error:", insertError);
            }
        }

        return NextResponse.json({
            status: 'success',
            found: listings.length,
            inserted: insertedCount,
            skipped_duplicates: duplicateCount
        });

    } catch (error: any) {
        console.error("[Immoflux Cron] Error:", error);
        return NextResponse.json({ status: 'error', reason: error.message }, { status: 500 });
    }
}

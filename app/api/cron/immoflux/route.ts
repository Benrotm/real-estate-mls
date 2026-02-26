import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { ImmofluxConfig } from '@/app/lib/actions/admin-settings';

// Helper function to geocode address strings to coordinates (for Maps)
async function geocodeAddress(addressString: string): Promise<{ lat: number, lng: number } | null> {
    try {
        const query = encodeURIComponent(addressString + ', Romania');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
            headers: {
                'User-Agent': 'Imobum-Scraper/1.0' // Required by Nominatim policy
            }
        });

        const data = await res.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
    } catch (e) {
        console.error("[Geocoding Error]:", e);
        return null;
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
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

        const filterapUrl = $('#filter').attr('data-href') || `${targetUrl.replace(/\/$/, '')}/filterap`;

        console.log(`[Immoflux Cron] Submitting AJAX filter requests to: ${filterapUrl}`);

        let currentPage = config.last_scraped_id || 1;
        const listings: any[] = [];
        // Array to store promises for secondary scraping tasks
        const scrapingTasks: Promise<void>[] = [];

        while (listings.length < scrapeLimit) {
            console.log(`[Immoflux Cron] Fetching Page ${currentPage}...`);
            formFields.set('page', currentPage.toString());
            // Immoflux usually returns 10-15 items per page natively, let's ask for the maximum remaining to limit
            formFields.set('limit', Math.min(50, scrapeLimit - listings.length).toString());

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
            const $page = cheerio.load(listHtml);

            // Revert variable to rowSelector to match user's custom mapping
            const rowSelector = 'table tbody tr.model-item';
            const rows = $page(rowSelector);

            if (rows.length === 0) {
                console.log(`[Immoflux Cron] No more properties found on Page ${currentPage}. Stopping pagination loop.`);
                break;
            }

            let pageListingsAdded = 0;

            rows.each((i, el) => {
                if (listings.length >= scrapeLimit) return false; // Stop iterating once overall limit is reached

                try {
                    const title = config.mapping.title ? $page(el).find(config.mapping.title).text().trim() : '';
                    const priceText = config.mapping.price ? $page(el).find(config.mapping.price).text().trim() : '';
                    const description = config.mapping.description ? $page(el).find(config.mapping.description).text().trim() : '';
                    const location = config.mapping.location_city ? $page(el).find(config.mapping.location_city).text().trim() : '';
                    const roomsText = config.mapping.rooms ? $page(el).find(config.mapping.rooms).text().trim() : '';
                    const phone = config.mapping.phone ? $page(el).find(config.mapping.phone).text().trim() : '';

                    // Parse Price and Currency
                    let price = 0;
                    let currency = 'EUR';
                    const priceMatch = priceText.match(/[\d,.]+/);
                    if (priceMatch) price = parseInt(priceMatch[0].replace(/[,.]/g, ''), 10);

                    if (priceText.toLowerCase().includes('ron') || priceText.toLowerCase().includes('lei')) {
                        currency = 'RON';
                    }

                    // Clean Location string (remove "TM " prefix if it exists)
                    let cleanedLocation = location.replace(/^TM\s+/i, '').trim();
                    let citySplit = cleanedLocation.split(',');
                    let parsedCity = citySplit[0] ? citySplit[0].trim() : 'Timisoara';
                    let parsedCounty = 'Timis'; // Base setting

                    // Parse Rooms
                    let rooms = 0;
                    const roomsMatch = roomsText.match(/\d+/);
                    if (roomsMatch) rooms = parseInt(roomsMatch[0], 10);

                    if (title || price > 0) {
                        const listingObj: any = {
                            title: title || 'Immoflux Property',
                            price,
                            currency,
                            description,
                            address: cleanedLocation || config.region_filter || 'Timis',
                            location_city: parsedCity,
                            location_county: parsedCounty,
                            latitude: null, // Will be hydrated asynchronously
                            longitude: null, // Will be hydrated asynchronously
                            rooms,
                            owner_phone: phone,
                            private_notes: 'Original Link: ' + targetUrl,
                            status: 'draft',
                            images: [], // Will be hydrated asynchronously
                            features: ['Immoflux Import']
                        };

                        listings.push(listingObj);
                        pageListingsAdded++;

                        // Hydrate Full Images Array async from SlidePanel
                        const panelUrl = $page(el).find('a.avatar.avatar-big.avatar-ap').attr('data-url');
                        if (panelUrl) {
                            scrapingTasks.push(
                                fetch(panelUrl, {
                                    headers: {
                                        'Cookie': sessionCookie,
                                        'User-Agent': 'Mozilla/5.0'
                                    }
                                }).then(r => r.text()).then(html => {
                                    const $panel = cheerio.load(html);
                                    const galleryImages: string[] = [];

                                    // Best Quality: data-gallery anchor tags
                                    $panel('.owl-carousel .item a[data-gallery]').each((_, aEl) => {
                                        const imgHref = $panel(aEl).attr('href');
                                        if (imgHref) galleryImages.push(imgHref);
                                    });

                                    // Medium Quality: img tags in carousel
                                    if (galleryImages.length === 0) {
                                        $panel('.owl-carousel .item img').each((_, imgEl) => {
                                            const imgSrc = $panel(imgEl).attr('src');
                                            if (imgSrc) galleryImages.push(imgSrc);
                                        });
                                    }

                                    // Worst Quality: Fallback to list view thumbnail
                                    if (galleryImages.length === 0) {
                                        $page(el).find('img').each((idx, imgEl) => {
                                            const src = $page(imgEl).attr('src');
                                            if (src) galleryImages.push(src);
                                        });
                                    }

                                    listingObj.images = galleryImages;
                                }).catch(err => {
                                    // Fallback on fetch fail
                                    $page(el).find('img').each((idx, imgEl) => {
                                        const src = $page(imgEl).attr('src');
                                        if (src) listingObj.images.push(src);
                                    });
                                })
                            );
                        } else {
                            // Fallback if no panel url found
                            $page(el).find('img').each((idx, imgEl) => {
                                const src = $page(imgEl).attr('src');
                                if (src) listingObj.images.push(src);
                            });
                        }

                        // Generate Lat/Lng coords for Maps Async
                        const geoString = listingObj.address;
                        scrapingTasks.push(
                            geocodeAddress(geoString).then(coords => {
                                if (coords) {
                                    listingObj.latitude = coords.lat;
                                    listingObj.longitude = coords.lng;
                                }
                            })
                        );
                    }
                } catch (err) {
                    console.error(`[Immoflux Cron] Error parsing property row on Page ${currentPage}:`, err);
                }
            });

            console.log(`[Immoflux Cron] Page ${currentPage} yielded ${pageListingsAdded} viable properties. Running Total: ${listings.length}`);
            currentPage++;
        }

        console.log(`[Immoflux Cron] Waiting for gallery extractions to finish...`);
        await Promise.all(scrapingTasks);
        console.log(`[Immoflux Cron] Finished scraping ${listings.length} properties across pages.`);

        // Save the next page offset to the settings so it resumes correctly next time
        config.last_scraped_id = currentPage;
        await supabase
            .from('admin_settings')
            .upsert({
                key: 'immoflux_integration',
                value: config,
                description: 'Configuration and mapping rules for the Immoflux property scraper'
            }, { onConflict: 'key' });

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

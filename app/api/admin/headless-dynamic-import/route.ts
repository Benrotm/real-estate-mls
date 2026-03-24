import { NextResponse } from 'next/server';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createPropertyFromData } from '@/app/lib/actions/properties';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { url, selectors, propertyData, cookies, html, adminId, extraData } = payload;

        let dataToSave: any;

        if (propertyData) {
            // Data was extracted directly by the microservice (e.g. Immoflux list scraping)
            dataToSave = propertyData;
        } else {
            if (!url || !selectors) {
                return NextResponse.json({ success: false, error: 'Missing url or selectors' }, { status: 400 });
            }

            // 1. Scrape the Property using Cheerio
            const scrapeResult = await scrapeProperty(url, selectors, cookies, html);

            if (scrapeResult.error || !scrapeResult.data) {
                return NextResponse.json({ success: false, error: scrapeResult.error || 'Failed to extract data' });
            }
            dataToSave = scrapeResult.data;
        }

        // Merge extra data from microservice (e.g. agent info from FluxMLS listing table)
        if (extraData) {
            // Carefully merge array values like features so we don't accidentally overwrite scraped data
            if (extraData.features && Array.isArray(extraData.features)) {
                const existingFeatures = Array.isArray(dataToSave.features) ? dataToSave.features : [];
                dataToSave.features = Array.from(new Set([...existingFeatures, ...extraData.features]));
                // Remove features from extraData so it doesn't overwrite it in Object.assign
                delete extraData.features;
            }
            Object.assign(dataToSave, extraData);
        }

        let finalOwnerId = adminId;

        if (!finalOwnerId) {
            // Fetch an Admin ID to automatically own the headless imported properties
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );
            const { data: adminUser } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .in('role', ['super_admin', 'admin'])
                .limit(1)
                .single();
            finalOwnerId = adminUser?.id;
        }

        // 2. Prevent Duplication (Server-Side Hard Stop)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if URL already exists in scraped_urls with 'success'
        if (url && url !== 'immoflux_batch') {
            const { data: existingUrl } = await supabaseAdmin
                .from('scraped_urls')
                .select('id')
                .eq('url', url)
                .eq('status', 'success')
                .maybeSingle();

            if (existingUrl) {
                console.log(`[DUPLICATE BLOCKED] URL already successfully scraped: ${url}`);
                return NextResponse.json({ 
                    success: true, 
                    message: 'Property already exists (URL match)',
                    alreadyExists: true 
                });
            }
        }

        // 3. Save the Property to the Database using the internal action
        const saveResult = await createPropertyFromData(dataToSave, url || 'immoflux_batch', finalOwnerId);

        if (!saveResult.success) {
            return NextResponse.json({ success: false, error: saveResult.error || 'Failed to save to database' });
        }

        // 3. Prevent Duplication: Insert generic URLs into the `scraped_urls` tracking table.
        // The Scraper Microservice macro searches this table during runs to determine if it should skip fetching an ad.
        if (url && url !== 'immoflux_batch') {
            const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            await adminClient.from('scraped_urls').upsert({
                url: url,
                status: 'success'
            }, { onConflict: 'url' });
        }

        return NextResponse.json({
            success: true,
            id: saveResult.data?.id,
            title: dataToSave.title
        });

    } catch (error: any) {
        console.error('Headless Import API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

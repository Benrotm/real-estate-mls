import { NextResponse } from 'next/server';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createPropertyFromData } from '@/app/lib/actions/properties';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { url, selectors, propertyData, cookies, html } = payload;

        let dataToSave;

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

        // Fetch an Admin ID to automatically own the headless imported properties
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: adminUser } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1)
            .single();

        // 2. Save the Property to the Database using the internal action
        const saveResult = await createPropertyFromData(dataToSave as any, url || 'immoflux_batch', adminUser?.id);

        if (!saveResult.success) {
            return NextResponse.json({ success: false, error: saveResult.error || 'Failed to save to database' });
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

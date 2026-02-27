import { NextResponse } from 'next/server';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createPropertyFromData } from '@/app/lib/actions/properties';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { url, selectors } = payload;

        if (!url || !selectors) {
            return NextResponse.json({ success: false, error: 'Missing url or selectors' }, { status: 400 });
        }

        // 1. Scrape the Property using Cheerio
        const scrapeResult = await scrapeProperty(url, selectors);

        if (scrapeResult.error || !scrapeResult.data) {
            return NextResponse.json({ success: false, error: scrapeResult.error || 'Failed to extract data' });
        }

        // 2. Save the Property to the Database using the internal action
        const saveResult = await createPropertyFromData(scrapeResult.data as any, url);

        if (!saveResult.success) {
            return NextResponse.json({ success: false, error: saveResult.error || 'Failed to save to database' });
        }

        return NextResponse.json({
            success: true,
            id: saveResult.data?.id,
            title: scrapeResult.data.title
        });

    } catch (error: any) {
        console.error('Headless Import API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

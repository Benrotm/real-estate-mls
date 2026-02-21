'use server';

import { scrapeProperty, ScrapedProperty } from './scrape';

export async function scrapeAdvanced(url: string, customSelectors?: any): Promise<{ data?: ScrapedProperty; error?: string }> {
    try {
        console.log(`Starting Advanced Scrape for ${url}`);

        // 1. Get the fast data first
        const fastResult = await scrapeProperty(url, customSelectors);

        if (fastResult.error) {
            return fastResult;
        }

        const data = fastResult.data!;

        // 2. Fetch encrypted fields from our isolated Microservice
        if (url.includes('publi24.ro') && !data.owner_phone) {
            console.log('Pinging advanced scraper microservice...');
            try {
                // Determine the correct microservice URL
                // In production, this will be your final Render.com URL
                const scraperApiUrl = process.env.NODE_ENV === 'production'
                    ? (process.env.NEXT_PUBLIC_SCRAPER_API_URL || 'http://localhost:8080/api/scrape-advanced')
                    : 'http://localhost:8080/api/scrape-advanced';

                const response = await fetch(scraperApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.owner_phone) {
                        data.owner_phone = result.owner_phone;
                        console.log('Successfully retrieved phone from Microservice:', data.owner_phone);
                    }
                } else {
                    console.error('Microservice responded with error:', response.status);
                }
            } catch (err) {
                console.error('Failed to communicate with scraper microservice:', err);
                // We do not fail the whole scrape here, we just continue without the phone number
            }
        }

        return { data };

    } catch (error: any) {
        console.error('Advanced Scraping Error:', error);
        return { error: 'Failed to run advanced scrape. ' + (error.message || '') };
    }
}

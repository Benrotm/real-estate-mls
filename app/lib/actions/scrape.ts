'use server';

import * as cheerio from 'cheerio';

export interface ScrapedProperty {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    images?: string[];
    address?: string;
    type?: string;
    listing_type?: string;
    url?: string;
}

export async function scrapeProperty(url: string): Promise<{ data?: ScrapedProperty; error?: string }> {
    try {
        if (!url || !url.startsWith('http')) {
            return { error: 'Invalid URL provided' };
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            return { error: `Failed to fetch URL: ${response.statusText}` };
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const data: ScrapedProperty = { url };

        // 1. Try to find JSON-LD (Schema.org)
        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const json = JSON.parse($(element).html() || '{}');
                const items = Array.isArray(json) ? json : [json];

                for (const item of items) {
                    const type = item['@type'];
                    // Look for RealEstateListing, Product, or SingleFamilyResidence, etc.
                    if (
                        type === 'RealEstateListing' ||
                        type === 'Product' ||
                        type === 'SingleFamilyResidence' ||
                        type === 'Apartment' ||
                        type === 'House' ||
                        type === 'Accommodation'
                    ) {
                        if (item.name) data.title = item.name;
                        if (item.description) data.description = item.description;

                        // Images can be string, array of strings, or ImageObject
                        if (item.image) {
                            if (typeof item.image === 'string') data.images = [item.image];
                            else if (Array.isArray(item.image)) {
                                data.images = item.image.map((img: any) => typeof img === 'string' ? img : img.url);
                            } else if (typeof item.image === 'object' && item.image.url) {
                                data.images = [item.image.url];
                            }
                        }

                        // Price
                        if (item.offers) {
                            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                            if (offer.price) data.price = Number(offer.price);
                            if (offer.priceCurrency) data.currency = offer.priceCurrency;
                        }

                        // Address
                        if (item.address) {
                            if (typeof item.address === 'string') data.address = item.address;
                            else if (typeof item.address === 'object') {
                                const parts = [
                                    item.address.streetAddress,
                                    item.address.addressLocality,
                                    item.address.addressRegion
                                ].filter(Boolean);
                                if (parts.length > 0) data.address = parts.join(', ');
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing JSON-LD:', e);
            }
        });

        // 2. Fallback to OpenGraph / Meta tags if data is missing
        if (!data.title) {
            data.title = $('meta[property="og:title"]').attr('content') || $('title').text();
        }
        if (!data.description) {
            data.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
        }
        if (!data.images || data.images.length === 0) {
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage) data.images = [ogImage];
        }
        if (!data.url) {
            data.url = $('meta[property="og:url"]').attr('content') || url;
        }

        // Try to guess price from meta or common selectors if still missing
        if (!data.price) {
            // Very generic selectors, might need refinement for specific sites
            const priceText = $('.price, [class*="price"], [id*="price"]').first().text().replace(/[^0-9.,]/g, '');
            if (priceText) {
                const cleanPrice = priceText.replace(/,/g, ''); // Simple cleanup
                const parsed = parseFloat(cleanPrice);
                if (!isNaN(parsed)) data.price = parsed;
            }
        }

        // Default assumptions if we found something
        if (data.title) {
            if (!data.currency) data.currency = 'EUR'; // Default to EUR for this market
            if (!data.type) data.type = 'Apartment'; // Default
            if (!data.listing_type) data.listing_type = 'For Sale'; // Default
        }

        return { data };

    } catch (error: any) {
        console.error('Scraping error:', error);
        return { error: error.message || 'Failed to scrape URL' };
    }
}

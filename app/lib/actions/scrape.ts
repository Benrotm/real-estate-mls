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
    [key: string]: any;
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
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            return { error: `Failed to fetch URL: ${response.statusText}` };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts/styles to clean up text extraction
        $('script, style, noscript, iframe, svg, nav, footer, header').remove();

        const data: ScrapedProperty = { url };
        const imagesSet = new Set<string>();

        // Helper: Resolve and Add Image
        const addImage = (src?: string) => {
            if (!src) return;
            try {
                // Handle relative URLs
                const absoluteUrl = new URL(src, url).toString();
                // Basic filtering
                if (absoluteUrl.match(/\.(jpg|jpeg|png|webp)/i) || !absoluteUrl.match(/\.(svg|gif|ico)/i)) {
                    // Check for 'logo' or 'icon' in name as heuristic to skip
                    if (!absoluteUrl.toLowerCase().includes('logo') && !absoluteUrl.toLowerCase().includes('icon')) {
                        imagesSet.add(absoluteUrl);
                    }
                }
            } catch (e) { }
        };

        // 1. Meta / OpenGraph Images (Get ALL)
        $('meta[property="og:image"]').each((_, el) => addImage($(el).attr('content')));
        $('meta[name="twitter:image"]').each((_, el) => addImage($(el).attr('content')));

        // 2. JSON-LD Parsing
        $('script[type="application/ld+json"]').each((_, element) => {
            try {
                const content = $(element).html();
                if (!content) return;
                const json = JSON.parse(content);
                const items = Array.isArray(json) ? json : [json];

                for (const item of items) {
                    // Extract Images from JSON-LD
                    if (item.image) {
                        if (typeof item.image === 'string') addImage(item.image);
                        else if (Array.isArray(item.image)) {
                            item.image.forEach((img: any) => addImage(typeof img === 'string' ? img : img.url));
                        } else if (typeof item.image === 'object' && item.image.url) {
                            addImage(item.image.url);
                        }
                    }

                    // Extract other fields (Title, Desc, Price) - simplified override logic
                    if (['RealEstateListing', 'Product', 'Place', 'Apartment', 'House'].includes(item['@type'])) {
                        if (item.name) data.title = item.name;
                        if (item.description) data.description = item.description;
                        if (item.offers) {
                            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                            if (offer.price) data.price = Number(offer.price);
                            if (offer.priceCurrency) data.currency = offer.priceCurrency;
                        }
                    }
                }
            } catch (e) { console.error('JSON-LD Error', e); }
        });

        // 3. Fallback: Search for Gallery/Slider Images in DOM
        if (imagesSet.size < 5) {
            const gallerySelectors = [
                '.gallery img', '.slider img', '.carousel img', '.swiper-wrapper img',
                '.property-images img', '.listing-photos img', '[data-fancybox] img',
                'figure img', '.photo-grid img', '.images img', '#gallery img',
                '.main-image img', '.detail-images img'
            ];
            $(gallerySelectors.join(', ')).each((_, el) => {
                addImage($(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy'));
            });

            // 3b. Try to find links to images (common in lightboxes like Facnybox/Lightbox)
            $('a[href]').each((_, el) => {
                const href = $(el).attr('href');
                if (href && /\.(jpg|jpeg|png|webp)$/i.test(href)) {
                    // Heuristic: Check if parent has "gallery" or "photo" class or if it's a direct valid image link
                    if ($(el).closest('[class*="gallery"], [class*="photo"], [class*="image"], [id*="gallery"]').length > 0) {
                        addImage(href);
                    }
                }
            });

            // 3c. Try Background Images
            $('[style*="background-image"]').each((_, el) => {
                const style = $(el).attr('style');
                if (style) {
                    const match = style.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match && match[1]) {
                        addImage(match[1]);
                    }
                }
            });
        }

        // 3d. Specific Site Logic (Casadomi)
        const casadomiGallery = $('#property-main-gallery');
        if (casadomiGallery.length > 0) {
            // Find both images and anchor links in the gallery items
            casadomiGallery.find('.property-main-gallery-item').each((_, el) => {
                const img = $(el).find('img').attr('src');
                const link = $(el).find('a').attr('href');

                // Prefer link if it looks like an image, mainly looking for 'big__' for high res
                if (link && /\.(jpg|jpeg|png|webp)$/i.test(link)) {
                    addImage(link);
                } else if (img) {
                    // Try to construct high-res url if it's a thumbnail (starts with small__)
                    let highRes = img;
                    if (img.includes('small__')) {
                        highRes = img.replace('small__', 'big__');
                    }
                    addImage(highRes);
                }
            });
        }

        // 4. Last Resort: Big Images in Body
        if (imagesSet.size < 3) {
            $('img').each((_, el) => {
                const src = $(el).attr('src');
                const width = $(el).attr('width');
                // Only accept if clearly not tiny (heuristic)
                if (width && parseInt(width) > 300) {
                    addImage(src);
                } else if (!width && $(el).parent().prop('tagName') === 'FIGURE') {
                    addImage(src);
                }
            });
        }


        // Fallback fields using Meta
        if (!data.title) data.title = $('meta[property="og:title"]').attr('content') || $('title').text();
        if (!data.description) data.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');

        // --- CATCH-ALL DESCRIPTION LOGIC ---
        // Extract visible text from likely content areas to append to description
        let catchAllText = '';

        // Strategy: Get text from specific containers or fall back to body
        const contentContainer = $('article, main, #content, .content, .listing-detail, .property-description').first();
        const root = contentContainer.length ? contentContainer : $('body');

        // Collect text from generic tags, formatted
        const lines: string[] = [];
        root.find('p, li, h1, h2, h3, h4, h5, tr').each((_, el) => {
            const text = $(el).text().replace(/\s+/g, ' ').trim();
            if (text.length > 10) { // Filter out short noise
                lines.push(text);
            }
        });

        catchAllText = lines.join('\n');

        // Append to description
        const existingDesc = data.description || '';
        // Avoid duplicating if the meta desc is basically the start of the text
        if (!catchAllText.includes(existingDesc.substring(0, 50))) {
            data.description = `${existingDesc}\n\n=== AUTOMATICALLY SCRAPED DETAILS (Unsorted) ===\n${catchAllText.substring(0, 3000)}\n================================================`;
        } else {
            data.description = catchAllText.substring(0, 3000); // Prefer the full text if meta desc is just a snippet
        }

        data.images = Array.from(imagesSet).slice(0, 25); // Cap at 25 images

        // Defaults
        if (data.title && !data.currency) data.currency = 'EUR';
        if (data.title && !data.type) data.type = 'Apartment';

        return { data };

    } catch (error: any) {
        console.error('Scraping Error:', error);
        return { error: 'Failed to scrape property data' };
    }
}

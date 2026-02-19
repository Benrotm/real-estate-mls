'use server';

import * as cheerio from 'cheerio';

export interface ScrapedProperty {
    title?: string;
    description?: string;
    price?: number;
    currency?: string;
    images?: string[];

    // Type
    type?: string;
    listing_type?: string;

    // Contact
    owner_name?: string;
    owner_phone?: string;
    private_notes?: string;

    // Location
    address?: string; // location selector maps to address usually
    location_county?: string;
    location_city?: string;
    location_area?: string;

    // Specs
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;

    area?: number; // generic
    area_usable?: number;
    area_built?: number;
    area_terrace?: number;
    area_garden?: number;

    floor?: number;
    total_floors?: number;
    year_built?: number;

    partitioning?: string;
    comfort?: string;

    building_type?: string;
    interior_condition?: string;
    furnishing?: string;

    // Media & Features
    features?: string[];
    video_url?: string;
    virtual_tour_url?: string;

    url?: string;
    [key: string]: any;
    debugInfo?: any;
}

export async function scrapeProperty(url: string, customSelectors?: any): Promise<{ data?: ScrapedProperty; error?: string }> {
    try {
        if (!url || !url.startsWith('http')) {
            return { error: 'Invalid URL provided' };
        }

        const response = await fetch(url, {
            cache: 'no-store',
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

        // Remove styles/iframes to clean up text extraction (keep scripts for JSON-LD/Global Vars)
        $('style, noscript, iframe, svg, nav, footer, header').remove();

        const data: ScrapedProperty = { url };
        data.debugInfo = {
            htmlLength: html.length,
            galleryFound: false,
            galleryItemsCount: 0,
            casadomiImagesFound: 0
        };
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

        // Helper: Clean Number
        const getNumber = (sel: string, isInt: boolean = false) => {
            if (!sel) return undefined;
            let txt = $(sel).first().text().trim();
            if (!txt) return undefined;

            // Extract the first contiguous sequence of numbers, dots, commas, and spaces
            const match = txt.match(/\d+[\d.,\s]*\d+|\d+/);
            if (!match) return undefined;
            txt = match[0].replace(/\s/g, ''); // strip spaces

            // Handle EU format: 1.234,56 -> 1234.56
            // Or 1.234 -> 1234 (if followed by 3 digits and looks like thousands)
            if (txt.match(/[0-9]\.[0-9]{3}/)) {
                // Likely thousands separator if we see dot followed by 3 digits
                // And if there is a comma later, it's definitely EU
                if (txt.includes(',') || txt.split('.').length > 1) {
                    txt = txt.replace(/\./g, '').replace(',', '.');
                }
            } else if (txt.includes(',')) {
                // If just comma and no dot (e.g. 123,45), replace with dot
                txt = txt.replace(',', '.');
            }

            const cleanTxt = txt.replace(/[^0-9.]/g, '');
            return isInt ? parseInt(cleanTxt) : parseFloat(cleanTxt);
        };

        // Helper: Get Text
        const getText = (sel: string) => {
            if (!sel) return undefined;
            return $(sel).first().text().trim() || undefined;
        };

        // 0. CUSTOM SELECTORS (Priority High)
        if (customSelectors) {
            // Basics
            if (customSelectors.title) data.title = getText(customSelectors.title);
            if (customSelectors.currency) data.currency = getText(customSelectors.currency);
            if (customSelectors.description) data.description = getText(customSelectors.description);
            if (customSelectors.type) data.type = getText(customSelectors.type);
            if (customSelectors.listing_type) data.listing_type = getText(customSelectors.listing_type);

            // Contact
            if (customSelectors.owner_name) data.owner_name = getText(customSelectors.owner_name);
            if (customSelectors.owner_phone) data.owner_phone = getText(customSelectors.owner_phone);
            if (customSelectors.private_notes) data.private_notes = getText(customSelectors.private_notes);

            if (customSelectors.price) {
                // Special price handling to cleanup currency symbols if mixed
                data.price = getNumber(customSelectors.price);
            }

            // Location
            if (customSelectors.location) data.address = getText(customSelectors.location);
            if (customSelectors.location_county) data.location_county = getText(customSelectors.location_county);
            if (customSelectors.location_city) data.location_city = getText(customSelectors.location_city);
            if (customSelectors.location_area) data.location_area = getText(customSelectors.location_area);

            // Specs - Strings
            if (customSelectors.partitioning) data.partitioning = getText(customSelectors.partitioning);
            if (customSelectors.comfort) data.comfort = getText(customSelectors.comfort);
            if (customSelectors.building_type) data.building_type = getText(customSelectors.building_type);
            if (customSelectors.interior_condition) data.interior_condition = getText(customSelectors.interior_condition);
            if (customSelectors.furnishing) data.furnishing = getText(customSelectors.furnishing);

            // Specs - Numbers
            if (customSelectors.rooms) data.rooms = getNumber(customSelectors.rooms, true);
            if (customSelectors.bedrooms) data.bedrooms = getNumber(customSelectors.bedrooms, true);
            if (customSelectors.bathrooms) data.bathrooms = getNumber(customSelectors.bathrooms, true);

            if (customSelectors.area) data.area_usable = getNumber(customSelectors.area); // Map 'area' to usable by default
            if (customSelectors.area_usable) data.area_usable = getNumber(customSelectors.area_usable);
            if (customSelectors.area_built) data.area_built = getNumber(customSelectors.area_built);
            if (customSelectors.area_terrace) data.area_terrace = getNumber(customSelectors.area_terrace);
            if (customSelectors.area_garden) data.area_garden = getNumber(customSelectors.area_garden);

            if (customSelectors.floor) data.floor = getNumber(customSelectors.floor, true);
            if (customSelectors.total_floors) data.total_floors = getNumber(customSelectors.total_floors, true);
            if (customSelectors.year_built) data.year_built = getNumber(customSelectors.year_built, true);

            // Media
            if (customSelectors.video_url) data.video_url = $(customSelectors.video_url).attr('src') || $(customSelectors.video_url).attr('href');
            if (customSelectors.virtual_tour_url) data.virtual_tour_url = $(customSelectors.virtual_tour_url).attr('src') || $(customSelectors.virtual_tour_url).attr('href');

            // Features List
            if (customSelectors.features) {
                const feats: string[] = [];
                $(customSelectors.features).each((_, el) => {
                    const txt = $(el).text().trim();
                    if (txt) feats.push(txt);
                });
                if (feats.length > 0) data.features = feats;
            }

            // Images
            if (customSelectors.images) {
                $(customSelectors.images).each((_, el) => {
                    addImage($(el).attr('src') || $(el).attr('data-src') || $(el).attr('href'));
                });
            }
        }

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
            if (data.debugInfo) data.debugInfo.galleryFound = true;
            const items = casadomiGallery.find('.property-main-gallery-item');
            if (data.debugInfo) data.debugInfo.galleryItemsCount = items.length;

            // Find both images and anchor links in the gallery items
            items.each((_, el) => {
                const img = $(el).find('img').attr('src');
                const link = $(el).find('a').attr('href');


                // Prefer link if it looks like an image, mainly looking for 'big__' for high res
                if (link && /\.(jpg|jpeg|png|webp)$/i.test(link)) {
                    addImage(link);
                    if (data.debugInfo) data.debugInfo.casadomiImagesFound++;
                } else if (img) {
                    // Try to construct high-res url if it's a thumbnail (starts with small__)
                    let highRes = img;
                    if (img.includes('small__')) {
                        highRes = img.replace('small__', 'big__');
                        addImage(highRes);
                    }
                }
            });
        }

        // Helper to parse numbers from text string (not selector)
        const parseNumber = (txt: string) => {
            if (!txt) return undefined;
            // Remove superscripts/subscripts if possible (cheerio might just give text)
            // Fix: "53 m2" -> "53" (stop at first unit)
            // Heuristic: take the first number found (removing the ^ anchor handles things like "etaj 2", and adding \s handles "87 990")
            const match = txt.match(/\d+[\d.,\s]*\d+|\d+/);
            if (match) {
                let clean = match[0].replace(/\s/g, '').replace(/,/g, '.');
                // Remove trailing dots
                if (clean.endsWith('.')) clean = clean.slice(0, -1);
                return parseFloat(clean);
            }
            return undefined;
        };

        // 3d. Specific Site Logic (Publi24 - Attributes Table)
        if (url.includes('publi24.ro')) {
            $('.attribute-item').each((_, el) => {
                // Use children() or find() but restrict to immediate context to avoid nested concatenation
                const label = $(el).find('.attribute-label strong').text().trim().toLowerCase();
                const value = $(el).find('.attribute-value').first().text().trim();

                if (label.includes('etaj')) {
                    if (value.toLowerCase().includes('parter')) data.floor = 0;
                    else if (value.toLowerCase().includes('demisol')) data.floor = -1;
                    else data.floor = parseNumber(value);
                }
                if (label.includes('constructi')) {
                    // Check if it's "Dupa 2000" or similar
                    const year = parseNumber(value);
                    if (year && year > 1900 && year < 2100) data.year_built = year;
                }
                if (label.includes('compartimentare')) data.partitioning = value;
                if (label.includes('camere')) data.rooms = parseNumber(value);
                if (label.includes('utila')) data.area_usable = parseNumber(value);
                if (label.includes('baie') || label.includes('bai')) data.bathrooms = parseNumber(value);
                if (label.includes('niveluri')) data.total_floors = parseNumber(value);
            });

            // Publi24 Description - Feature Extraction Fallback
            const descLower = (data.description || '').toLowerCase();
            const potentialFeatures = [
                { key: 'centrala', value: 'Centrala proprie' },
                { key: 'incalzire pardoseala', value: 'Incalzire in pardoseala' },
                { key: 'aer conditionat', value: 'Aer conditionat' },
                { key: 'parcare', value: 'Loc de parcare' },
                { key: 'garaj', value: 'Garaj' },
                { key: 'lift', value: 'Lift' },
                { key: 'balcon', value: 'Balcon' },
                { key: 'mobilat', value: 'Mobilat' }
            ];

            potentialFeatures.forEach(feat => {
                if (descLower.includes(feat.key)) {
                    if (!data.features) data.features = [];
                    if (!data.features.includes(feat.value)) data.features.push(feat.value);
                }
            });

            // Publi24 Image List (Fixed for dynamic push)
            $('script').each((_, el) => {
                const content = $(el).html() || '';
                if (content.includes('imageList.push')) {
                    const regex = /imageList\.push\(\{\s*src:\s*'([^']+)'/g;
                    let match;
                    while ((match = regex.exec(content)) !== null) {
                        if (match[1]) addImage(match[1]);
                    }
                } else if (content.includes('var imageList =')) {
                    const match = content.match(/var\s+imageList\s*=\s*(\[[\s\S]*?\]);/);
                    if (match && match[1]) {
                        try {
                            const json = JSON.parse(match[1]);
                            if (Array.isArray(json)) {
                                json.forEach((img: any) => { if (img.src) addImage(img.src); });
                            }
                        } catch (e) { }
                    }
                }
            });
        }


        // 3e. Specific Site Logic (Publi24 - imageList)
        // Publi24 stores full gallery in a global variable `var imageList = [...]`
        $('script').each((_, el) => {
            const content = $(el).html();
            if (content && content.includes('var imageList =')) {
                try {
                    // Extract the array: var imageList = [...];
                    const match = content.match(/var\s+imageList\s*=\s*(\[[\s\S]*?\]);/);
                    if (match && match[1]) {
                        const json = JSON.parse(match[1]);
                        if (Array.isArray(json)) {
                            json.forEach((img: any) => {
                                if (img.src) addImage(img.src);
                            });
                        }
                    } else if (content.includes('imageList.push')) {
                        // Fallback: Handle imageList.push({...}) pattern
                        const pushMatches = content.matchAll(/imageList\.push\(({[\s\S]*?})\);/g);
                        for (const pushMatch of pushMatches) {
                            try {
                                const json = JSON.parse(pushMatch[1]);
                                if (json.src) addImage(json.src);
                            } catch (e) {
                                // ignore parse error for individual push
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing Publi24 imageList:', e);
                }
            }
        });

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

        // Clean up scripts now that we are done with them
        $('script').remove();


        // Fallback fields using Meta
        if (!data.title) data.title = $('meta[property="og:title"]').attr('content') || $('title').text();
        if (!data.description) data.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');

        // --- CATCH-ALL DESCRIPTION LOGIC ---
        // Extract visible text from likely content areas to append to description
        let catchAllText = '';

        // Strategy: Get text from specific containers or fall back to body
        const contentContainer = $('article, main, #content, .content, .listing-detail, .property-description, .article-description').first();
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
        if (data.title && !data.type) {
            const textToSearch = (data.title + ' ' + (url || '')).toLowerCase();
            if (textToSearch.includes('casa') || textToSearch.includes('vila') || textToSearch.includes('house') || textToSearch.includes('villa')) {
                data.type = 'House';
            } else if (textToSearch.includes('teren') || textToSearch.includes('land') || textToSearch.includes('lot')) {
                data.type = 'Land';
            } else if (textToSearch.includes('spatiu') || textToSearch.includes('office') || textToSearch.includes('comercial')) {
                data.type = 'Commercial';
            } else {
                data.type = 'Apartment';
            }
        }

        return { data };

    } catch (error: any) {
        console.error('Scraping Error:', error);
        return { error: 'Failed to scrape property data' };
    }
}

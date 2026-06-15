'use server';

import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getAdminSettings } from './admin-settings';

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

export async function scrapeProperty(url: string, customSelectors?: any, cookies?: string, rawHtml?: string): Promise<{ data?: ScrapedProperty; error?: string }> {
    try {
        if (!url || !url.startsWith('http')) {
            return { error: 'Invalid URL provided' };
        }

        // --- Fetch Proxy Integration ---
        const settings = await getAdminSettings();
        const proxyConfig = settings?.proxy_integration;

        let fetchOptions: RequestInit = {
            cache: 'no-store',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        };

        if (cookies) {
            (fetchOptions.headers as any)['Cookie'] = cookies;
        }

        if (proxyConfig && proxyConfig.is_active && proxyConfig.host && proxyConfig.port) {
            let proxyUrl = `http://${proxyConfig.host}:${proxyConfig.port}`;
            // Add credentials if they exist
            if (proxyConfig.username && proxyConfig.password) {
                proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
            }

            console.log(`[Proxy] Routing Cheerio fetch through Residential Proxy: ${proxyConfig.host}:${proxyConfig.port}`);

            // Next.js explicitly supports agent in standard fetch starting late v13/v14 depending on the Undici iteration natively.
            const agent = new HttpsProxyAgent(proxyUrl);
            (fetchOptions as any).dispatcher = agent; // Works in Undici native fetch
        }

        let html = rawHtml;
        if (!html) {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                return { error: `Failed to fetch URL: ${response.statusText}` };
            }

            html = await response.text();
        }

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
            else if ((customSelectors as any).phone) data.owner_phone = getText((customSelectors as any).phone);
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
                let content = $(element).html();
                if (!content) return;
                // Clean invalid control characters that crash JSON.parse
                content = content.replace(/[\u0000-\u001F]+/g, '');
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
            const unmappedSpecs: string[] = [];
            $('.attribute-item').each((_, el) => {
                // Use children() or find() but restrict to immediate context to avoid nested concatenation
                const labelElement = $(el).find('.attribute-label strong');
                const labelText = labelElement.text().trim();
                const label = labelText.toLowerCase();
                const value = $(el).find('.attribute-value').first().text().trim();

                let isMapped = false;
                if (label.includes('etaj')) {
                    if (value.toLowerCase().includes('parter')) data.floor = 0;
                    else if (value.toLowerCase().includes('demisol')) data.floor = -1;
                    else data.floor = parseNumber(value);
                    isMapped = true;
                } else if (label.includes('constructi')) {
                    // Check if it's "Dupa 2000" or similar
                    const year = parseNumber(value);
                    if (year && year > 1900 && year < 2100) data.year_built = year;
                    isMapped = true;
                } else if (label.includes('compartimentare')) {
                    data.partitioning = value;
                    isMapped = true;
                } else if (label.includes('camere')) {
                    data.rooms = parseNumber(value);
                    isMapped = true;
                } else if (label.includes('utila')) {
                    data.area_usable = parseNumber(value);
                    isMapped = true;
                } else if (label.includes('baie') || label.includes('bai')) {
                    data.bathrooms = parseNumber(value);
                    isMapped = true;
                } else if (label.includes('niveluri')) {
                    data.total_floors = parseNumber(value);
                    isMapped = true;
                }

                if (!isMapped && labelText && value) {
                    unmappedSpecs.push(`- ${labelText}: ${value}`);
                }
            });

            if (unmappedSpecs.length > 0) {
                const specsText = `\n\nMore details:\n${unmappedSpecs.join('\n')}`;
                data.description = (data.description || '') + specsText;
            }

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

            // Publi24 Location Extraction (Robust)
            // Strategy 1: Find the location link near the map pin icon
            // Publi24 shows location as a clickable link like "Timis, Timisoara Girocului" near a map pin
            let locationText = '';

            // Look for location links that contain county/city references (typically next to map icon)
            $('a[href*="/anunturi/"]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text().trim();
                // Location links usually lead to a filtered listing page and contain short text like "Timis, Timisoara Girocului"
                if (text && text.length < 80 && text.includes(',') && !text.includes('EUR') && !text.includes('anunt')) {
                    // Check this isn't a breadcrumb by verifying it has comma-separated location-like parts
                    const parts = text.split(',').map(p => p.trim());
                    const hasLocationWord = parts.some(p => !['Publi24', 'Anunturi', 'Imobiliare', 'De vanzare', 'De inchiriat',
                        'Apartamente', 'Apartamente 2 camere', 'Apartamente 3 camere', 'Apartamente 4 camere',
                        'Case', 'Garsoniere', 'Terenuri'].includes(p));
                    if (hasLocationWord && parts.length >= 2) {
                        locationText = text;
                    }
                }
            });

            // Strategy 2: Look for the "Timis, Timisoara ..." text near map/harta links
            if (!locationText) {
                const mapLink = $('a[href*="harta"], a[href*="#map"]').first();
                if (mapLink.length) {
                    const parentText = mapLink.parent().text().trim();
                    // Remove "Vezi pe harta" / "harta" text
                    const cleaned = parentText.replace(/vezi\s+pe\s+hart[aă]/gi, '').replace(/hart[aă]/gi, '').trim();
                    if (cleaned && cleaned.length < 100) {
                        locationText = cleaned;
                    }
                }
            }

            // Strategy 3: Extract county/city from the URL path 
            // URL format: /anunturi/imobiliare/de-vanzare/apartamente/apartamente-3-camere/anunt/...
            // or: /anunturi/imobiliare/de-vanzare/apartamente/timis/  (category pages include county)
            if (!locationText) {
                try {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/').filter(p => p && p !== 'anunturi' && p !== 'imobiliare'
                        && p !== 'de-vanzare' && p !== 'de-inchiriat' && p !== 'anunt'
                        && !p.startsWith('apartamente') && !p.startsWith('case') && !p.startsWith('garsoniere')
                        && !p.startsWith('terenuri') && !p.startsWith('spatii') && !p.includes('.html'));

                    // Romanian counties list for matching
                    const romanianCounties = ['alba', 'arad', 'arges', 'bacau', 'bihor', 'bistrita-nasaud', 'botosani',
                        'braila', 'brasov', 'bucuresti', 'buzau', 'calarasi', 'caras-severin', 'cluj', 'constanta',
                        'covasna', 'dambovita', 'dolj', 'galati', 'giurgiu', 'gorj', 'harghita', 'hunedoara', 'ialomita',
                        'iasi', 'ilfov', 'maramures', 'mehedinti', 'mures', 'neamt', 'olt', 'prahova', 'salaj',
                        'satu-mare', 'sibiu', 'suceava', 'teleorman', 'timis', 'tulcea', 'valcea', 'vaslui', 'vrancea'];

                    for (const part of pathParts) {
                        if (romanianCounties.includes(part.toLowerCase())) {
                            // Capitalize first letter
                            const county = part.charAt(0).toUpperCase() + part.slice(1);
                            if (!data.location_county) data.location_county = county;
                        }
                    }
                } catch (e) { }
            }

            // Strategy 4: Parse title for neighborhood hints
            // Titles often contain neighborhood names: "Apartament 3 camere, Spitalul Judetean, Girocului, parter..."
            if (!locationText && data.title) {
                const titleParts = data.title.split(',').map(p => p.trim()).filter(p => p);
                // Skip the first part (usually "Apartament X camere") and last parts (usually building details)
                // Look for parts that could be neighborhoods
                const skipWords = ['apartament', 'camere', 'camera', 'parter', 'etaj', 'bloc', 'mp', 'boxa', 'proprietar', 'decomandat', 'semidecomandat', 'izolat'];
                const possibleLocations = titleParts.filter(p => {
                    const lower = p.toLowerCase();
                    return !skipWords.some(w => lower.includes(w)) && p.length > 2 && p.length < 40;
                });
                if (possibleLocations.length > 0 && !data.location_area) {
                    data.location_area = possibleLocations.join(', ');
                }
            }

            // Strategy 5: Filtered breadcrumbs as absolute last resort
            if (!locationText && !data.location_county) {
                const crumbs: string[] = [];
                const excludeWords = ['publi24', 'anunturi', 'imobiliare', 'de vanzare', 'de inchiriat',
                    'apartamente', 'case', 'garsoniere', 'terenuri', 'spatii comerciale',
                    'apartamente 1 camera', 'apartamente 2 camere', 'apartamente 3 camere', 'apartamente 4 camere'];

                $('[itemprop="itemListElement"] span, .breadcrumbs li a, .breadcrumb li a').each((_, el) => {
                    const text = $(el).text().trim();
                    if (text && !excludeWords.includes(text.toLowerCase())) {
                        crumbs.push(text);
                    }
                });
                if (crumbs.length >= 1) {
                    locationText = crumbs.join(', ');
                }
            }

            // Parse locationText into structured fields
            if (locationText) {
                locationText = locationText.replace(/\s+/g, ' ').replace(/(,\s*)+/g, ', ').replace(/(\s*-\s*)+/g, ', ').trim();
                // Remove "Vezi pe" prefix if present
                locationText = locationText.replace(/^vezi\s+pe\s+/i, '').trim();

                const parts = locationText.split(',').map(p => p.trim()).filter(p => p);

                if (parts.length > 0) {
                    if (!data.location_county) data.location_county = parts[0];
                    if (parts.length > 1 && !data.location_city) {
                        const cityParts = parts[1].split(' ');
                        data.location_city = cityParts[0];

                        if (cityParts.length > 1 && !data.location_area) {
                            data.location_area = cityParts.slice(1).join(' ');
                        }
                    }
                    if (!data.address) data.address = locationText;
                }
            }

            // Build a proper address string for geocoding
            if (!data.address) {
                const addrParts = [data.location_area, data.location_city, data.location_county, 'Romania'].filter(Boolean);
                if (addrParts.length > 1) data.address = addrParts.join(', ');
            }

            // Geocode the extracted address so the frontend map pin works immediately
            if (data.address && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
                try {
                    const params = new URLSearchParams({
                        address: data.address,
                        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    });
                    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
                    const geoData = await geoRes.json();

                    if (geoData.status === 'OK' && geoData.results && geoData.results.length > 0) {
                        const location = geoData.results[0].geometry.location;
                        data.latitude = location.lat;
                        data.longitude = location.lng;
                    }
                } catch (e) {
                    // Fail silently, just won't have the lat/long pre-filled
                    console.log('Geocoding failed during scrape for:', data.address);
                }
            }

            // Publi24 Owner info
            const profileLinks = $('a[href*="/public-user-profile-"]');
            profileLinks.each((_, el) => {
                const nameText = $(el).text().trim() || $(el).find('img').attr('alt')?.trim();
                // Avoid capturing long sentences if it's the wrong link
                if (nameText && nameText.length < 50 && !data.owner_name) {
                    data.owner_name = nameText;
                }
            });

            // Publi24 Phone number usually embedded in the payload
            if (!data.owner_phone) {
                const htmlText = $('body').html() || '';
                // Look for standard 10 digit romanian numbers (02, 03, 07 prefixes)
                // Use strict boundaries to avoid false positives inside larger strings (like FB App IDs)
                const regex = /(?:^|[^0-9])(0[237][0-9]{8})(?:[^0-9]|$)/g;
                let match = regex.exec(htmlText);
                if (match) {
                    data.owner_phone = match[1];
                }
            }

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

        // 3e-olx. Specific Site Logic (OLX.ro - Parameters, Location, Images)
        if (url.includes('olx.ro')) {
            const unmappedSpecs: string[] = [];

            // OLX parameters are in <p> and <li> tags
            $('p, li').each((_, el) => {
                const text = $(el).text().trim();

                if (text.startsWith('Suprafata utila') || text.includes('Suprafață utilă')) {
                    const m = text.match(/(\d+)/);
                    if (m && !data.area_usable) data.area_usable = parseInt(m[1]);
                } else if (text.startsWith('Etaj')) {
                    const m = text.match(/(\d+)/);
                    if (m && !data.floor) data.floor = parseInt(m[1]);
                } else if (text.startsWith('Compartimentare')) {
                    const val = text.replace(/Compartimentare:?/i, '').trim();
                    if (val && !data.partitioning) data.partitioning = val;
                } else if (text.match(/^An construc[tț]ie/i)) {
                    const m = text.match(/(\d{4})/);
                    if (m && !data.year_built) data.year_built = parseInt(m[1]);
                } else if (text.match(/^Nr\.?\s*camere/i) || text.match(/^\d+\s*camer/)) {
                    const m = text.match(/(\d+)/);
                    if (m && !data.rooms) data.rooms = parseInt(m[1]);
                }
            });

            // Extract rooms from breadcrumbs if not found
            if (!data.rooms) {
                $('li[data-testid="breadcrumb-item"] a, ol li a').each((_, el) => {
                    const text = $(el).text().trim();
                    const m = text.match(/(\d+)\s*camer/);
                    if (m && !data.rooms) data.rooms = parseInt(m[1]);
                });
            }

            // OLX Location - from map link text or breadcrumbs
            const mapLinkText = $('[data-testid="map-link-text"]').text().trim();
            if (mapLinkText) {
                const parts = mapLinkText.split(',').map(p => p.trim());
                if (parts.length >= 1 && !data.location_city) data.location_city = parts[0];
                if (parts.length >= 2 && !data.location_county) data.location_county = parts[1];
                if (!data.address) data.address = mapLinkText;
            }

            // OLX Coords - from Google Maps link
            $('a[href*="maps.google.com"]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const m = href.match(/ll=([0-9.-]+),([0-9.-]+)/);
                if (m && !data.latitude) {
                    data.latitude = parseFloat(m[1]);
                    data.longitude = parseFloat(m[2]);
                }
            });

            // Build address if not set
            if (!data.address) {
                const addrParts = [data.location_city, data.location_county, 'Romania'].filter(Boolean);
                if (addrParts.length > 1) data.address = addrParts.join(', ');
            }

            // OLX Images from CDN
            if (imagesSet.size < 5) {
                $('img').each((_, el) => {
                    const src = $(el).attr('src') || $(el).attr('data-src') || '';
                    if (src && (src.includes('apollo.olxcdn.com') || src.includes('img.olx')) && !src.includes('avatar') && !src.includes('logo')) {
                        addImage(src);
                    }
                });
            }
        }

        // 3e-publi24. Specific Site Logic (Publi24 - imageList & img tags)
        if (url.includes('publi24.ro') && imagesSet.size < 5) {
            $('img').each((_, el) => {
                const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy');
                if (src && src.includes('s3.publi24.ro') && !src.includes('avatar') && !src.includes('logo')) {
                    addImage(src);
                }
            });
        }

        // 3f. Specific Site Logic (Immoflux.ro)
        if (url.includes('immoflux.ro')) {
            // Paranoid Info Text Capture
            const infoContainer = $('.slidepanel-info').first();
            const infoTextOriginal = infoContainer.text().trim();
            const fullBodyText = $('body').text();

            // Description Extraction - Handle unstructured text nodes
            let descH4 = $('h4').filter((_, el) => $(el).text().trim().toLowerCase() === 'descriere');
            if (descH4.length === 0) {
                descH4 = $('.example-title').filter((_, el) => $(el).text().trim().toLowerCase().includes('descriere'));
            }
            if (descH4.length > 0) {
                const parentContents = descH4.parent().contents();
                const startIndex = parentContents.index(descH4);
                if (startIndex !== -1) {
                    const descParts: string[] = [];
                    for (let i = startIndex + 1; i < parentContents.length; i++) {
                        const node = parentContents.eq(i);
                        const tagName = node.prop('tagName')?.toLowerCase();
                        if (tagName === 'h4' || tagName === 'h3' || tagName === 'script' || tagName === 'style') {
                            break;
                        }
                        if (node.hasClass('site-action') || node.hasClass('slidePanel-actions')) {
                            break;
                        }
                        
                        if (node[0].type === 'text') {
                            const rawText = (node[0] as any).data;
                            if (rawText) descParts.push(rawText);
                        } else {
                            const text = node.text();
                            if (text) descParts.push(text);
                        }
                    }
                    if (descParts.length > 0) {
                        data.description = descParts.join('').trim();
                    }
                }
            }

            // Fallback for description if sibling traversal is empty or did not work
            if (!data.description) {
                const container = $('.slidePanel-inner-section');
                if (container.length > 0) {
                    const fullText = container.text().trim();
                    const descMatch = fullText.match(/Descriere\s*:?\s*([\s\S]+)/i);
                    if (descMatch && descMatch[1]) {
                        let immoDesc = descMatch[1].trim();
                        const cutOffMatch = immoDesc.match(/([\s\S]+?)(?:\s+Detalii suplimentare|\s+Caracteristici|\s+Dotari|\s*Zona|$)/i);
                        data.description = cutOffMatch ? cutOffMatch[1].trim() : immoDesc;
                    }
                }
            }

            // Specs extraction (Immoflux-specific)
            const areaMatch = fullBodyText.match(/(?:Suprafata utila|Suprafață utilă)\s*:\s*([\d.,]+)/i) || fullBodyText.match(/SU\s+([\d.,]+)\s*mp/i) || fullBodyText.match(/SU\s*:\s*([\d.,]+)/i) || fullBodyText.match(/suprafat[aă]\s*(?:util[aă])?\s*(?:de\s*)?([\d.,]+)\s*m/i);
            if (areaMatch) {
                data.area_usable = parseFloat(areaMatch[1].replace(',', '.'));
            }

            const yearMatch = fullBodyText.match(/(?:An constructie|An construcție)[\s:]*(\d{4})/i);
            if (yearMatch) {
                data.year_built = parseInt(yearMatch[1], 10);
            }

            const roomsMatch = fullBodyText.match(/Camere\s*:\s*(\d+)/i) || fullBodyText.match(/(\d+)\s*camere/i);
            if (roomsMatch && !data.rooms) {
                data.rooms = parseInt(roomsMatch[1], 10);
            }

            const baiMatch = fullBodyText.match(/(?:Bai|Băi)\s*:\s*(\d+)/i);
            if (baiMatch) {
                data.bathrooms = parseInt(baiMatch[1], 10);
            }

            const balcMatch = fullBodyText.match(/Balcoane\s*:\s*(\d+)/i);
            if (balcMatch) {
                data.area_terrace = parseInt(balcMatch[1], 10);
            }

            const floorMatch = fullBodyText.match(/Etaj\s*:\s*(\d+)/i);
            if (floorMatch) {
                data.floor = parseInt(floorMatch[1], 10);
            }

            const regimMatch = fullBodyText.match(/[Rr]egim(?:\s+de)?\s+(?:inaltime|înălțime|in[aă]l[tț]ime)[:\s]*P\s*\+\s*(\d+)/i);
            if (regimMatch) {
                data.total_floors = parseInt(regimMatch[1], 10);
            } else {
                const pPlusMatch = fullBodyText.match(/P\s*\+\s*(\d+)\s*(?:E|etaj)/i);
                if (pPlusMatch) {
                    data.total_floors = parseInt(pPlusMatch[1], 10);
                }
            }

            // ADVANCED NOISE FILTERING
            const noiseWords = ['activa', 'apartament', 'casa', 'vila', 'teren', 'spatiu', 'status:', 'tip:', 'portaluri', 'adresa:', 'zona:'];
            const filterNoiseParanoid = (val: any) => {
                if (!val || typeof val !== 'string') return '';
                let clean = val.replace(/\s+/g, ' ').trim();
                const lower = clean.toLowerCase();

                // If it's just a noise word or label, kill it
                if (noiseWords.some(n => lower === n || lower === n.replace(':', '') || lower.startsWith(n))) {
                    // Only keep if it's longer than the noise word and doesn't look like just a label
                    if (lower.length < 10 && noiseWords.some(n => lower.includes(n))) return '';
                }

                // Specific hard kills
                if (lower === 'activa' || lower.includes('status: activa')) return '';

                return clean;
            };

            // Force clean initial values
            data.location_area = filterNoiseParanoid(data.location_area);
            data.location_city = filterNoiseParanoid(data.location_city);

            const getLabelValueRobust = (label: string, stops: string[]) => {
                // Look in both container and body
                const source = infoTextOriginal.length > 20 ? infoTextOriginal : fullBodyText;
                const regex = new RegExp(`${label}\\s*:?\\s*([\\s\\S]+?)(?:${stops.join('|')}|$)`, 'i');
                const match = source.match(regex);
                return match ? match[1].trim() : '';
            };

            const cityRaw = getLabelValueRobust('Adresa', ['Portaluri', 'Telefon', 'Status', 'Tip']) || data.location_city;
            const areaRaw = getLabelValueRobust('Zona', ['Adresa', 'Portaluri', 'Telefon', 'Status', 'Tip']) || data.location_area;

            let finalCity = filterNoiseParanoid(cityRaw) || 'Timisoara';
            let finalArea = filterNoiseParanoid(areaRaw);

            // Cleanup City "TM " prefix
            if (finalCity.toLowerCase().startsWith('tm ')) {
                finalCity = finalCity.replace(/^tm\s+/i, '').trim();
            }

            data.location_city = finalCity;
            data.location_area = finalArea;
            data.location_county = data.location_county || 'Timis';

            // Synthesize Definitive Address
            const addrParts = [finalArea, finalCity, data.location_county, 'Romania'].filter(p => p && p.length > 2);
            data.address = addrParts.join(', ');

            // Image Extraction (Prioritize href for high-res)
            $('.owl-carousel .item a').each((_, el) => {
                const highRes = $(el).attr('href');
                if (highRes) addImage(highRes);
            });

            // Phone Extraction (High Priority)
            const phoneMatch = fullBodyText.match(/Telefon\s*:?\s*([+]*[\s\d]{8,20})/i);
            if (phoneMatch && phoneMatch[1]) {
                const cleanedPhone = phoneMatch[1].trim().replace(/\s/g, '');
                if (cleanedPhone.length >= 10) data.owner_phone = cleanedPhone;
            }

            if (!data.owner_phone) {
                // Secondary check for text near phone icon
                const phoneIcon = $('i.fa-phone, i.wb-mobile').parent();
                if (phoneIcon.length) {
                    const phoneText = phoneIcon.text().trim();
                    if (phoneText.match(/[+0-9\s]{10,}/)) {
                        data.owner_phone = phoneText.replace(/\s+/g, '').replace('Telefon:', '').trim();
                    }
                }
            }

        }

        // 3g. Specific Site Logic (FluxMLS - fluxmls.immoflux.ro)
        if (url.includes('fluxmls.immoflux.ro')) {
            // 1. Clean Title - sometimes contains metadata or price
            if (data.title) {
                // Remove price if it leaked into title (e.g. "Apartament 3 camere - 120.000 EUR")
                data.title = data.title.split('-')[0].split(' - ')[0].trim();
                // Remove "Adaugat / Modificat" noise
                data.title = data.title.replace(/Adaugat:.*$/i, '').replace(/Modificat:.*$/i, '').trim();
            }

            // 2. Clean description - remove "Descriere" header and structural noise
            if (data.description) {
                data.description = data.description
                    .replace(/^\s*Descriere\s*/i, '')
                    .replace(/Localizare\s*[\s\S]*?(?=Caracteristici|$)/i, '') // Remove localization info if it's redundant
                    .replace(/Proximitate\s*[\s\S]*?(?=Caracteristici|$)/i, '')
                    .replace(/Caracteristici principale\s*[\s\S]*?(?=Utilitati|$)/i, '')
                    .trim();

                // If the description became empty due to over-aggressive cleaning or were mostly headers, 
                // we might want a fallback, but usually "Descriere" is followed by actual text.
            }

            // 3. Parse .property-show-zone which returns "City, Area"
            // We favor this over greedy selectors to avoid technical specs leaking into address
            const zoneText = getText('.property-show-zone') || getText('.slidePanel-inner-section .hide-on-private a') || data.location_city || '';
            const zoneCleaned = zoneText.replace(/^\s*\uf041\s*/, '').trim();

            if (zoneCleaned) {
                // Split by comma but be careful of multiple commas
                const parts = zoneCleaned.split(',').map((p: string) => p.trim()).filter((p: string) => p);
                if (parts.length >= 2) {
                    data.location_city = parts[0];
                    data.location_area = parts.slice(1).join(', ');
                } else if (parts.length === 1) {
                    data.location_city = parts[0];
                    data.location_area = '';
                }
            }

            // 3. Determine county from city name (FluxMLS has properties across Romania)
            // Comprehensive map covering major cities, resort towns, and neighborhoods
            const cityCountyMap: Record<string, string> = {
                // ---- Bucuresti & Ilfov ----
                'bucuresti': 'Bucuresti', 'bucharest': 'Bucuresti',
                'pantelimon': 'Ilfov', 'bragadiru': 'Ilfov', 'voluntari': 'Ilfov',
                'popesti-leordeni': 'Ilfov', 'otopeni': 'Ilfov', 'chitila': 'Ilfov',
                'magurele': 'Ilfov', 'buftea': 'Ilfov', 'chiajna': 'Ilfov',
                'domnesti': 'Ilfov', 'cornetu': 'Ilfov', 'jilava': 'Ilfov',
                'stefanestii de jos': 'Ilfov', 'tunari': 'Ilfov', 'afumati': 'Ilfov',
                // ---- Constanta (Black Sea Coast) ----
                'constanta': 'Constanta', 'constanța': 'Constanta',
                'costinesti': 'Constanta', 'costinești': 'Constanta',
                'mamaia': 'Constanta', 'mamaia-sat': 'Constanta',
                'eforie': 'Constanta', 'eforie nord': 'Constanta', 'eforie sud': 'Constanta',
                'neptun': 'Constanta', 'olimp': 'Constanta', 'jupiter': 'Constanta',
                'venus': 'Constanta', 'saturn': 'Constanta', 'cap aurora': 'Constanta',
                'mangalia': 'Constanta', 'vama veche': 'Constanta', '2 mai': 'Constanta',
                'navodari': 'Constanta', 'năvodari': 'Constanta',
                'techirghiol': 'Constanta', 'agigea': 'Constanta',
                'cernavoda': 'Constanta', 'cernavodă': 'Constanta',
                'medgidia': 'Constanta', 'ovidiu': 'Constanta',
                'cumpana': 'Constanta', 'cumpăna': 'Constanta',
                'lazu': 'Constanta', 'lumina': 'Constanta',
                'palazu mare': 'Constanta', 'tomis': 'Constanta',
                // ---- Timis ----
                'timisoara': 'Timis', 'timișoara': 'Timis',
                'lugoj': 'Timis', 'urseni': 'Timis', 'giroc': 'Timis',
                'dumbravita': 'Timis', 'dumbrăvița': 'Timis',
                'ghiroda': 'Timis', 'mosnita': 'Timis', 'moșnița': 'Timis',
                'sanandrei': 'Timis', 'sânandrei': 'Timis',
                'giarmata': 'Timis', 'giarmata vii': 'Timis',
                'recas': 'Timis', 'becicherecu mic': 'Timis',
                'deta': 'Timis', 'gataia': 'Timis', 'buzias': 'Timis',
                'jimbolia': 'Timis', 'sannicolau mare': 'Timis',
                'fratelia': 'Timis', 'lipovei': 'Timis', 'fabric': 'Timis',
                'iosefin': 'Timis', 'elisabetin': 'Timis', 'cetate': 'Timis',
                'dacia': 'Timis', 'sagului': 'Timis', 'șagului': 'Timis',
                'steaua': 'Timis', 'aradului': 'Timis', 'telegrafului': 'Timis',
                'calea urseni': 'Timis', 'girocului': 'Timis', 'soarelui': 'Timis',
                'punctele cardinale': 'Timis', 'dambovita': 'Timis', 'dâmbovița': 'Timis',
                'lugojului': 'Timis', 'torontalului': 'Timis', 'buziasului': 'Timis',
                'mosnita noua': 'Timis', 'moșnița nouă': 'Timis',
                // ---- Cluj ----
                'cluj-napoca': 'Cluj', 'cluj': 'Cluj',
                'turda': 'Cluj', 'campia turzii': 'Cluj', 'dej': 'Cluj',
                'floresti': 'Cluj', 'baciu': 'Cluj', 'apahida': 'Cluj',
                'gilau': 'Cluj', 'feleacu': 'Cluj', 'marasti': 'Cluj',
                // ---- Other Major Cities ----
                'iasi': 'Iasi', 'iași': 'Iasi',
                'brasov': 'Brasov', 'brașov': 'Brasov',
                'poiana brasov': 'Brasov', 'predeal': 'Brasov', 'rasnov': 'Brasov',
                'sacele': 'Brasov', 'codlea': 'Brasov', 'ghimbav': 'Brasov',
                'bartolomeu': 'Brasov', 'tractorul': 'Brasov', 'astra': 'Brasov',
                'craiova': 'Dolj',
                'galati': 'Galati', 'galați': 'Galati',
                'ploiesti': 'Prahova', 'ploiești': 'Prahova',
                'sinaia': 'Prahova', 'busteni': 'Prahova', 'azuga': 'Prahova',
                'campina': 'Prahova', 'câmpina': 'Prahova',
                'oradea': 'Bihor', 'arad': 'Arad',
                'pitesti': 'Arges', 'pitești': 'Arges',
                'curtea de arges': 'Arges', 'mioveni': 'Arges',
                'micesti': 'Arges', 'ratesti': 'Arges', 'rătești': 'Arges',
                'sibiu': 'Sibiu',
                'bacau': 'Bacau', 'bacău': 'Bacau',
                'buzau': 'Buzau', 'buzău': 'Buzau',
                'baia mare': 'Maramures', 'suceava': 'Suceava',
                'botosani': 'Botosani', 'botoșani': 'Botosani',
                'satu mare': 'Satu Mare',
                'targu mures': 'Mures', 'târgu mureș': 'Mures',
                'alba iulia': 'Alba', 'deva': 'Hunedoara',
                'resita': 'Caras-Severin', 'reșița': 'Caras-Severin',
                'braila': 'Braila', 'brăila': 'Braila',
                'targoviste': 'Dambovita', 'târgoviște': 'Dambovita',
                'giurgiu': 'Giurgiu', 'slobozia': 'Ialomita',
                'calarasi': 'Calarasi', 'călărași': 'Calarasi',
                'alexandria': 'Teleorman', 'tulcea': 'Tulcea',
                'ramnicu valcea': 'Valcea', 'râmnicu vâlcea': 'Valcea',
                'vaslui': 'Vaslui',
                'focsani': 'Vrancea', 'focșani': 'Vrancea',
                'piatra neamt': 'Neamt', 'piatra neamț': 'Neamt',
                'miercurea ciuc': 'Harghita',
                'sfantu gheorghe': 'Covasna',
                'zalau': 'Salaj', 'zalău': 'Salaj',
                // ---- Tulcea / Danube Delta ----
                'sulina': 'Tulcea', 'murighiol': 'Tulcea', 'sfantu gheorghe delta': 'Tulcea',
            };

            if (!data.location_county && data.location_city) {
                const cityLower = data.location_city.toLowerCase().normalize('NFC');
                // Never default to the region_filter. Set to 'Unknown' so the filter catches it instead of letting it pass as a false positive.
                data.location_county = cityCountyMap[cityLower] || 'Unknown';
            }

            // 3b. Region Filter: Skip properties that don't match the configured region
            const fluxSettings = settings?.fluxmls_integration;
            const regionFilter = fluxSettings?.region_filter?.trim();
            if (regionFilter && data.location_county) {
                const filterLower = regionFilter.toLowerCase();
                const countyLower = data.location_county.toLowerCase();
                if (filterLower !== countyLower) {
                    if (data.location_county === 'Unknown') {
                        console.log(`[FluxMLS] SKIPPING property in ${data.location_city} (Unknown County) — city is not mapped to "${regionFilter}"`);
                        return { error: `REGION_SKIP: Property in ${data.location_city} (Unknown County) does not match region filter "${regionFilter}"` };
                    } else {
                        console.log(`[FluxMLS] SKIPPING property in ${data.location_city} (${data.location_county}) — region filter is "${regionFilter}"`);
                        return { error: `REGION_SKIP: Property in ${data.location_city} (${data.location_county}) does not match region filter "${regionFilter}"` };
                    }
                }
            }

            // 4. Build a clean address from parsed components (deduplicate city/county)
            const countyForAddr = data.location_county && data.location_county.toLowerCase() !== (data.location_city || '').toLowerCase() ? data.location_county : '';
            const addrParts = [data.location_area, data.location_city, countyForAddr, 'Romania'].filter((p: any) => p && p.length > 1);
            data.address = addrParts.join(', ');
        }

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
        if (data.title && !data.listing_type) {
            const titleMatch = (data.title || '').toLowerCase();
            const textToSearch = (titleMatch + ' ' + (data.description || '') + ' ' + (url || '')).toLowerCase();
            const price = data.price || 0;

            const hasRentKeywords = textToSearch.includes('inchirier') || textToSearch.includes('închiriere') || textToSearch.includes('rent') || textToSearch.includes('chirie') || textToSearch.includes('inchiriez') || textToSearch.includes('închiriez');
            const hasSaleKeywords = textToSearch.includes('vanzare') || textToSearch.includes('vânzare') || textToSearch.includes('vand ') || textToSearch.includes('vând ') || textToSearch.includes('vândut');

            if (price > 10000 && !hasRentKeywords) {
                data.listing_type = 'For Sale';
            } else if (price < 4000 && price > 0 && hasRentKeywords) {
                data.listing_type = 'For Rent';
            } else if (hasRentKeywords && !hasSaleKeywords) {
                data.listing_type = 'For Rent';
            } else {
                data.listing_type = 'For Sale';
            }
        }

        // Defaults
        data.images = Array.from(imagesSet).slice(0, 25); // Cap at 25 images

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

        // Source URL is intentionally NOT stored in private_notes (per user request)

        // Geocode Location — always re-geocode using the final corrected address
        if (data.address && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            try {
                const geoQuery = encodeURIComponent(data.address);
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${geoQuery}&key=${apiKey}`);
                const geoData = await geoRes.json();
                if (geoData.status === 'OK' && geoData.results[0]) {
                    const loc = geoData.results[0].geometry.location;
                    data.latitude = loc.lat;
                    data.longitude = loc.lng;
                }
            } catch (e) {
                console.error('Geocoding Error:', e);
            }
        }

        return { data };

    } catch (error: any) {
        console.error('Scraping Error:', error);
        return { error: 'Failed to scrape property data' };
    }
}

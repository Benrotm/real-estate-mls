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

        // Fallback: if full address failed, try just the city name (first part before comma)
        const cityOnly = addressString.split(',')[0].trim();
        if (cityOnly && cityOnly !== addressString.trim()) {
            console.log(`[Geocoding] Full address "${addressString}" failed, retrying with city: "${cityOnly}"`);
            const fallbackQuery = encodeURIComponent(cityOnly + ', Romania');
            const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}`, {
                headers: { 'User-Agent': 'Imobum-Scraper/1.0' }
            });
            const fallbackData = await fallbackRes.json();
            if (fallbackData && fallbackData.length > 0) {
                return { lat: parseFloat(fallbackData[0].lat), lng: parseFloat(fallbackData[0].lon) };
            }
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

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode'); // e.g. 'watcher'

        console.log(`[Immoflux Cron] Starting Anti-Ban Scraper (Mode: ${mode || 'historical'})...`);

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
            return NextResponse.json({ status: 'error', reason: 'Credentials missing.' }, { status: 400 });
        }

        const randomBaseUA = getRandomUserAgent();

        // 2. Login to Immoflux
        console.log("[Immoflux Cron] Fetching login page to grab CSRF...");
        let sessionCookie = '';

        const loginGetRes = await fetch('https://blitz.immoflux.ro/login', {
            headers: { 'User-Agent': randomBaseUA }
        });

        const loginCookies = loginGetRes.headers.get('set-cookie');
        if (loginCookies) {
            sessionCookie = loginCookies.split(';')[0];
        }

        const loginHtml = await loginGetRes.text();
        const $login = cheerio.load(loginHtml);
        const csrfToken = $login('meta[name="csrf-token"]').attr('content');

        if (!csrfToken) {
            return NextResponse.json({ status: 'error', reason: 'Could not find CSRF token' }, { status: 500 });
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
                'User-Agent': randomBaseUA,
                'Referer': 'https://blitz.immoflux.ro/login'
            },
            body: formData.toString(),
            redirect: 'manual'
        });

        const authCookies = loginPostRes.headers.get('set-cookie');
        if (authCookies) {
            const newSession = authCookies.split(',').map(c => c.split(';')[0]).join('; ');
            sessionCookie = newSession;
        }

        // Delay after login
        await delay(1500 + Math.random() * 1000);

        // 3. Fetch Properties Dashboard
        const targetUrl = config.url || 'https://blitz.immoflux.ro/approperties';
        console.log(`[Immoflux Cron] Fetching dashboard: ${targetUrl}`);

        const dashboardRes = await fetch(targetUrl, {
            headers: { 'Cookie': sessionCookie, 'User-Agent': getRandomUserAgent() }
        });

        const dashboardHtml = await dashboardRes.text();
        let $ = cheerio.load(dashboardHtml);
        const dashboardCsrfToken = $('meta[name="csrf-token"]').attr('content') || csrfToken;

        const formFields = new URLSearchParams();
        $('#filter input[name], #filter select[name]').each((i, el) => {
            const name = $(el).attr('name') as string;
            const type = $(el).attr('type');
            let value = $(el).val() as string | string[] | undefined;

            if (type === 'radio' || type === 'checkbox') {
                if ($(el).is(':checked')) formFields.append(name, value as string);
            } else if (name === 'filter_transaction_id__in[]' || name === 'filter_status__eq' || $(el).is('select')) {
                $(el).find('option:selected').each((j, opt) => {
                    formFields.append(name, $(opt).val() as string);
                });
            } else {
                if (value !== undefined && value !== null) formFields.append(name, value as string);
            }
        });

        if (!formFields.has('_token')) formFields.set('_token', dashboardCsrfToken);
        const filterapUrl = $('#filter').attr('data-href') || `${targetUrl.replace(/\/$/, '')}/filterap`;

        let currentPage = config.last_scraped_id || 1;
        if (mode === 'watcher') {
            currentPage = 1;
        }

        console.log(`[Immoflux Cron] Fetching Page ${currentPage}...`);
        formFields.set('page', currentPage.toString());
        formFields.set('limit', '15'); // Small chunk to avoid Vercel timeouts

        // Another natural delay
        await delay(2000 + Math.random() * 1000);

        const listRes = await fetch(filterapUrl, {
            method: 'POST',
            headers: {
                'Cookie': sessionCookie,
                'User-Agent': getRandomUserAgent(),
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-CSRF-TOKEN': dashboardCsrfToken
            },
            body: formFields.toString()
        });

        const listHtml = await listRes.text();
        const $page = cheerio.load(listHtml);
        const rows = $page('table tbody tr.model-item');

        if (rows.length === 0) {
            console.log(`[Immoflux Cron] No more properties found. Next run will reset to page 1.`);
            config.last_scraped_id = 1; // Reset to page 1 so it loops back
            await supabase.from('admin_settings').upsert({ key: 'immoflux_integration', value: config }, { onConflict: 'key' });
            return NextResponse.json({ status: 'done', reason: 'No more properties found.' });
        }

        let watcherAborted = false;
        const baseItems: any[] = [];

        rows.each((i, el) => {
            try {
                const title = config.mapping.title ? $page(el).find(config.mapping.title).text().trim() : '';
                const priceText = config.mapping.price ? $page(el).find(config.mapping.price).text().trim() : '';
                const description = config.mapping.description ? $page(el).find(config.mapping.description).text().trim() : '';
                const location = config.mapping.location_city ? $page(el).find(config.mapping.location_city).text().trim() : '';
                const roomsText = config.mapping.rooms ? $page(el).find(config.mapping.rooms).text().trim() : '';
                const phone = config.mapping.phone ? $page(el).find(config.mapping.phone).text().trim() : '';

                let price = 0;
                let currency = 'EUR';
                const priceMatch = priceText.match(/[\d,.]+/);
                if (priceMatch) price = parseInt(priceMatch[0].replace(/[,.]/g, ''), 10);
                if (priceText.toLowerCase().includes('ron') || priceText.toLowerCase().includes('lei')) currency = 'RON';

                let listingType = 'For Sale';
                let propertyType = 'Apartment';
                const rowHtml = ($page(el).html() || '').toLowerCase();

                if (rowHtml.includes('inchirier') || rowHtml.includes('închirier')) listingType = 'For Rent';
                else if (rowHtml.includes('vanzar') || rowHtml.includes('vânzar')) listingType = 'For Sale';

                if (rowHtml.includes('cas') || rowHtml.includes('vil')) propertyType = 'House';
                else if (rowHtml.includes('teren')) propertyType = 'Land';
                else if (rowHtml.includes('spatiu comercial') || rowHtml.includes('spatiu industrial') || rowHtml.includes('birou')) propertyType = 'Commercial';
                else if (rowHtml.includes('apartament') || rowHtml.includes('garsonier')) propertyType = 'Apartment';

                let cleanedLocation = location.replace(/^TM\s+/i, '').trim();
                let citySplit = cleanedLocation.split(',');
                let parsedCity = citySplit[0] ? citySplit[0].trim() : 'Timisoara';

                let rooms = 0;
                const roomsMatch = roomsText.match(/\d+/);
                if (roomsMatch) rooms = parseInt(roomsMatch[0], 10);

                const transactionLabel = listingType === 'For Rent' ? 'For Rent' : 'For Sale';
                const roomsLabel = rooms > 0 ? `${rooms} Rooms` : '';
                const generatedTitle = [propertyType, transactionLabel, roomsLabel, cleanedLocation || parsedCity, price > 0 ? `${price.toLocaleString('en-US')} ${currency}` : '']
                    .filter(Boolean).join(' ');

                const panelUrl = $page(el).find('a.avatar.avatar-big.avatar-ap').attr('data-url');

                // Only collect base fields and the panelUrl here
                baseItems.push({
                    panelUrl,
                    fallbackImages: [],
                    listingObj: {
                        title: generatedTitle || title || 'Immoflux Property',
                        price,
                        currency,
                        type: propertyType,
                        listing_type: listingType,
                        description,
                        address: cleanedLocation || config.region_filter || 'Timis',
                        location_city: parsedCity,
                        location_county: 'Timis',
                        latitude: null,
                        longitude: null,
                        rooms,
                        owner_phone: phone,
                        private_notes: 'Original Link: ' + targetUrl,
                        status: 'draft',
                        images: [],
                        features: ['Immoflux Import']
                    }
                });

                $page(el).find('img').each((idx, imgEl) => {
                    const src = $page(imgEl).attr('src');
                    if (src) baseItems[baseItems.length - 1].fallbackImages.push(src);
                });

            } catch (err) {
                console.error(`[Immoflux Cron] Parsing error row ${i}:`, err);
            }
        });

        const listings: any[] = [];
        const delayMin = (config.delay_min || 3) * 1000;
        const delayMax = (config.delay_max || 8) * 1000;

        // SEQUENTIAL PROCESSING WITH RANDOMIZED DELAYS (Anti-Ban)
        for (let i = 0; i < baseItems.length; i++) {
            const item = baseItems[i];

            // Generate random delay between min and max
            const waitTime = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
            console.log(`[Immoflux] Fetching property ${i + 1}/${baseItems.length}. Waiting ${waitTime / 1000}s...`);
            await delay(waitTime);

            if (item.panelUrl) {
                try {
                    const res = await fetch(item.panelUrl, {
                        headers: { 'Cookie': sessionCookie, 'User-Agent': getRandomUserAgent() }
                    });
                    const html = await res.text();
                    const $panel = cheerio.load(html);
                    const galleryImages: string[] = [];

                    $panel('.owl-carousel .item a[data-gallery]').each((_, aEl) => {
                        const imgHref = $panel(aEl).attr('href');
                        if (imgHref) galleryImages.push(imgHref);
                    });

                    if (galleryImages.length === 0) {
                        $panel('.owl-carousel .item img').each((_, imgEl) => {
                            const imgSrc = $panel(imgEl).attr('src');
                            if (imgSrc) galleryImages.push(imgSrc);
                        });
                    }

                    item.listingObj.images = galleryImages.length > 0 ? galleryImages : item.fallbackImages;

                    const panelText = $panel.text();
                    const baiMatch = panelText.match(/Bai:\s*(\d+)/i);
                    if (baiMatch) item.listingObj.bathrooms = parseInt(baiMatch[1], 10);

                    const yearMatch = panelText.match(/An constructie:\s*(\d{4})/i);
                    if (yearMatch) item.listingObj.year_built = parseInt(yearMatch[1], 10);

                    const areaMatch = panelText.match(/Suprafata utila:\s*([\d.,]+)/i);
                    if (areaMatch) item.listingObj.area_usable = parseFloat(areaMatch[1].replace(',', '.'));

                    const balcMatch = panelText.match(/Balcoane:\s*(\d+)/i);
                    if (balcMatch) item.listingObj.area_terrace = parseInt(balcMatch[1], 10);

                    const parkMatch = panelText.match(/Locuri de parcare:\s*(\d+)/i);
                    if (parkMatch && parseInt(parkMatch[1], 10) > 0) item.listingObj.features.push('Parking');

                    const regimMatch = panelText.match(/[Rr]egim(?:\s+de)?\s+(?:inaltime|înălțime|in[aă]l[tț]ime)[:\s]*P\s*\+\s*(\d+)/i);
                    if (regimMatch) item.listingObj.total_floors = parseInt(regimMatch[1], 10);
                    else {
                        const pPlusMatch = panelText.match(/P\s*\+\s*(\d+)\s*(?:E|etaj)/i);
                        if (pPlusMatch) item.listingObj.total_floors = parseInt(pPlusMatch[1], 10);
                    }
                } catch (e) {
                    item.listingObj.images = item.fallbackImages;
                }
            } else {
                item.listingObj.images = item.fallbackImages;
            }

            // Sync Geocode
            const coords = await geocodeAddress(item.listingObj.address);
            if (coords) {
                item.listingObj.latitude = coords.lat;
                item.listingObj.longitude = coords.lng;
            }

            listings.push(item.listingObj);
        }

        // Only increment the pagination if we are in historical mode. 
        // Watcher mode should NOT touch the saved state.
        if (mode !== 'watcher') {
            config.last_scraped_id = currentPage + 1;
            await supabase.from('admin_settings').upsert({ key: 'immoflux_integration', value: config }, { onConflict: 'key' });
        }

        let insertedCount = 0;
        let duplicateCount = 0;
        const { data: admin } = await supabase.from('profiles').select('id').eq('role', 'super_admin').order('email', { ascending: true }).limit(1).single();

        for (const item of listings) {
            if (item._isDuplicate) {
                duplicateCount++;
                continue;
            }

            // Fallback safety check
            const { data: existing } = await supabase
                .from('properties')
                .select('id')
                .eq('price', item.price)
                .eq('address', item.address)
                .limit(1);

            if (existing && existing.length > 0) {
                duplicateCount++;
                continue;
            }

            const { _isDuplicate, ...cleanItem } = item;

            const { error: insertError } = await supabase
                .from('properties')
                .insert({ ...cleanItem, owner_id: admin?.id });

            if (!insertError) insertedCount++;
        }

        if (mode === 'watcher' && watcherAborted) {
            return NextResponse.json({
                status: 'done_watcher',
                found: listings.length,
                inserted: insertedCount,
                skipped_duplicates: duplicateCount,
                note: 'Watcher reached old listings and aborted safely.'
            });
        }

        return NextResponse.json({
            status: 'success',
            page_completed: currentPage,
            found: listings.length,
            inserted: insertedCount,
            skipped_duplicates: duplicateCount,
            note: 'Anti-ban randomized delays applied.'
        });

    } catch (error: any) {
        console.error("[Immoflux Cron] Error:", error);
        return NextResponse.json({ status: 'error', reason: error.message }, { status: 500 });
    }
}

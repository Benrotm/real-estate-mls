import { NextResponse } from 'next/server';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createProperty } from '@/app/lib/actions/properties';
import { createClient } from '@/app/lib/supabase/server';

export const maxDuration = 60; // Max out Vercel Serverless Function timeout for safety

export async function POST(req: Request) {
    try {
        const { url, phoneNumber, location } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        console.log(`[Bulk Import Webhook] Received URL: ${url}`);

        const supabase = await createClient();

        // 1. Initial Check: Is it already marked as success in scraped_urls?
        const { data: existing, error: existError } = await supabase
            .from('scraped_urls')
            .select('status')
            .eq('url', url)
            .single();

        if (existing && existing.status === 'success') {
            return NextResponse.json({ message: 'URL was already successfully scraped', status: 'skipped' });
        }

        // 2. Perform the full NextJS Scrape (which calls OCR microservice inside it)
        console.log(`[Bulk Import Webhook] Running full scrape for: ${url}`);
        const scrapeResult = await scrapeProperty(url);

        if (scrapeResult.error || !scrapeResult.data) {
            console.error(`[Bulk Import Webhook] Scrape Failed for ${url}:`, scrapeResult.error);
            // Log Failure
            await supabase.from('scraped_urls').upsert({
                url,
                status: 'failed',
                error_message: scrapeResult.error || 'Unknown parsing error'
            }, { onConflict: 'url' });

            return NextResponse.json({ error: scrapeResult.error }, { status: 500 });
        }

        // 3. Transform ScrapedData into FormData for `createProperty` action
        console.log(`[Bulk Import Webhook] Scrape Success. Creating property for: ${url}`);
        const propertyData = scrapeResult.data;
        const formData = new FormData();

        Object.entries(propertyData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    formData.append(key, JSON.stringify(value));
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        // Ensure status is active for bulk imports
        formData.append('status', 'active');
        // Mark that this is a system import (optional, handled by standard createProperty)

        // Use the existing action to preserve geocoding, validation, and db insert logic
        // NOTE: createProperty relies on extracting the user from the current session.
        // Because a background ping hits this endpoint, we MUST bypass the session check OR use service role.

        const res = await createSystemProperty(propertyData, url, phoneNumber, location);

        if (res.error) {
            console.error(`[Bulk Import Webhook] DB Insert Failed for ${url}:`, res.error);
            await supabase.from('scraped_urls').upsert({
                url,
                status: 'failed',
                error_message: res.error
            }, { onConflict: 'url' });
            return NextResponse.json({ error: res.error }, { status: 500 });
        }

        // 4. Mark as success
        await supabase.from('scraped_urls').upsert({
            url,
            status: 'success',
            error_message: null
        }, { onConflict: 'url' });

        return NextResponse.json({ message: 'Property successfully imported', id: res.data?.id });

    } catch (e: any) {
        console.error('[Bulk Import Webhook] Fatal Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}

// We need a server-role wrapper for property insertion because Vercel Server Actions 
// rely on `supabase.auth.getUser()`, which we don't have in a disconnected Webhook.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function createSystemProperty(data: any, url: string, phoneNumber?: string, location?: any) {
    // Connect using Service Role to bypass RLS and authenticate as system
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // We MUST use the service role key for cron webhooks as no user is logged in
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    try {
        let finalListingType = 'For Sale';
        const rawListingType = (data.listing_type || '').toLowerCase();
        if (rawListingType.includes('inchiriat') || rawListingType.includes('rent') || url.includes('de-inchiriat') || url.includes('/inchirieri/')) {
            finalListingType = 'For Rent';
        }

        // Use Render's Playwright-extracted location if available (much more accurate than cheerio)
        const locCounty = location?.county || data.location_county || '';
        const locCity = location?.city || data.location_city || '';
        const locArea = location?.area || data.location_area || '';
        const locAddress = location?.address || data.address || '';

        // Build a proper geocoding address if we have Render location data
        let finalAddress = locAddress;
        if (!finalAddress || finalAddress.length < 5) {
            const addrParts = [locArea, locCity, locCounty, 'Romania'].filter(Boolean);
            if (addrParts.length > 1) finalAddress = addrParts.join(', ');
        }

        // Geocode the location for map pin
        // ALWAYS re-geocode when Render provides location data, because cheerio's coordinates may be wrong
        let latitude = data.latitude;
        let longitude = data.longitude;
        const hasRenderLocation = location?.address;
        if (finalAddress && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (hasRenderLocation || !latitude || !longitude)) {
            try {
                const geocodeAddr = [locArea, locCity, locCounty, 'Romania'].filter(Boolean).join(', ');
                const params = new URLSearchParams({
                    address: geocodeAddr,
                    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                });
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
                const geoData = await geoRes.json();
                if (geoData.status === 'OK' && geoData.results?.[0]) {
                    latitude = geoData.results[0].geometry.location.lat;
                    longitude = geoData.results[0].geometry.location.lng;
                }
            } catch (e) {
                console.error('Geocoding failed:', e);
            }
        }

        const propertyData: any = {
            title: data.title || '',
            description: data.description || '',
            price: data.price ? parseFloat(data.price) : 0,
            currency: data.currency || 'EUR',
            listing_type: finalListingType,
            type: data.type || 'Apartment',

            // Location (Render Playwright data takes priority)
            address: finalAddress,
            location_county: locCounty,
            location_city: locCity,
            location_area: locArea,
            latitude: latitude,
            longitude: longitude,

            // Specs
            area_usable: data.area_usable ? parseFloat(data.area_usable) : null,
            area_built: data.area_built ? parseFloat(data.area_built) : null,
            rooms: data.rooms ? parseInt(data.rooms) : null,
            bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
            bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
            floor: data.floor ? parseInt(data.floor) : null,
            total_floors: data.total_floors ? parseInt(data.total_floors) : null,
            year_built: data.year_built ? parseInt(data.year_built) : null,

            partitioning: data.partitioning || '',
            comfort: data.comfort || '',
            building_type: data.building_type || '',
            interior_condition: data.interior_condition || '',
            furnishing: data.furnishing || '',

            features: data.features || [],
            images: data.images || [],

            // Contact
            owner_name: data.owner_name || 'System Import',
            owner_phone: phoneNumber || data.owner_phone || '',
            private_notes: data.private_notes || `Imported from: ${url}`,

            status: 'active',
            updated_at: new Date().toISOString()
        };

        // Get the first super_admin user to assign ownership if necessary
        const { data: admins } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1);

        if (admins && admins.length > 0) {
            propertyData.owner_id = admins[0].id;
        }

        const { data: newProperty, error } = await supabaseAdmin
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

        if (error) return { error: error.message };
        return { success: true, data: newProperty };
    } catch (e: any) {
        return { error: e.message };
    }
}

import { NextResponse } from 'next/server';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createProperty, createPropertyFromData } from '@/app/lib/actions/properties';
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
    try {
        // Build basic property data object from scraped data
        const propertyData: any = {
            ...data,
            owner_phone: phoneNumber || data.owner_phone || '',
            // Ensure location is synced if we have specific Render data
            address: location?.address || data.address || '',
            location_city: location?.city || data.location_city || 'Timisoara',
            location_county: location?.county || data.location_county || 'Timis',
            location_area: location?.area || data.location_area || '',
            latitude: location?.latitude || data.latitude,
            longitude: location?.longitude || data.longitude,
            status: 'active'
        };

        // Use the centralized robust action that handles enrichment, geocoding, and scoring
        // We bypass the session check by fetching a super_admin ID manually
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        const { data: admins } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .order('created_at', { ascending: true })
            .limit(1);

        const adminId = admins && admins.length > 0 ? admins[0].id : undefined;

        // Call our core high-level action
        return await createPropertyFromData(propertyData, url, adminId);
    } catch (e: any) {
        return { error: e.message };
    }
}

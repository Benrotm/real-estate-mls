import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPropertyFromData } from '@/app/lib/actions/properties';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        console.log('--- HEADLESS IMPORT SOLD PAYLOAD ---');
        console.log(JSON.stringify(payload, null, 2));
        const { url, adminId, extraData } = payload;

        if (!url || !extraData) {
            return NextResponse.json({ success: false, error: 'Missing url or extraData' }, { status: 400 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let finalOwnerId = adminId;
        if (!finalOwnerId) {
            const { data: adminUser } = await supabaseAdmin
                .from('profiles')
                .select('id, role')
                .in('role', ['super_admin', 'admin'])
                .limit(1)
                .single();
            finalOwnerId = adminUser?.id;
        }

        const dataToSave = {
            url: url,
            title: extraData.title || '',
            description: extraData.description || '',
            price: extraData.priceRaw 
                ? (typeof extraData.priceRaw === 'number' 
                    ? extraData.priceRaw 
                    : parseFloat(extraData.priceRaw.toString().replace(/[^\d.-]/g, '')) || null)
                : null,
            status: 'sold' as 'sold' | 'active' | 'draft' | 'pending',
            images: extraData.images || [],
            raw_extracted_data: extraData.raw_extracted_data || {},
            rooms: extraData.rooms || null,
            area_usable: extraData.usable_area || null,
            year_built: extraData.year_built || null,
            location_city: extraData.city || null,
            location_area: extraData.area || null,
            address: extraData.address || null,
            area_garden: extraData.land_area || null,
            type: (extraData.property_type || 'Apartment') as any, // Default fallback, but prioritize scraper's guess
            owner_name: extraData.owner_name || undefined,
            owner_phone: extraData.owner_phone || undefined,
            private_notes: extraData.private_notes || undefined,
        };

        const dom = extraData.days_on_market ? parseInt(extraData.days_on_market) : null;

        // 1. Create Property
        const saveResult = await createPropertyFromData(dataToSave, url, finalOwnerId);

        if (!saveResult.success || !saveResult.data) {
            console.error('Save to Properties Error:', saveResult.error);
            return NextResponse.json({ success: false, error: saveResult.error || 'Failed to save property' });
        }

        const newPropertyId = saveResult.data.id;

        // 2. Update Status to Sold (createPropertyFromData forces to 'active')
        await supabaseAdmin.from('properties')
            .update({ status: 'sold' })
            .eq('id', newPropertyId);

        // 3. Create Sold History Record
        await supabaseAdmin.from('property_sold_history')
            .insert([{
                property_id: newPropertyId,
                sold_price: dataToSave.price,
                sold_date: new Date().toISOString(),
                days_on_market: dom
            }]);

        // 3. Tracking table
        await supabaseAdmin.from('scraped_urls').upsert({
            url: url,
            status: 'success'
        }, { onConflict: 'url' });

        return NextResponse.json({
            success: true,
            id: newPropertyId,
            title: dataToSave.title
        });

    } catch (error: any) {
        console.error('Headless Import Sold API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

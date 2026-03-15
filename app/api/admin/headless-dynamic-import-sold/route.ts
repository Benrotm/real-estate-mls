import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const payload = await req.json();
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
            original_url: url,
            title: extraData.title || '',
            description: extraData.description || '',
            price_raw: extraData.priceRaw || '',
            price: extraData.priceRaw ? parseFloat(extraData.priceRaw.replace(/[^\d.-]/g, '')) || null : null,
            days_on_market: extraData.days_on_market ? parseInt(extraData.days_on_market) : null,
            status: extraData.status || 'Sold',
            images: extraData.images || [],
            raw_extracted_data: extraData.raw_extracted_data || {},
            created_by: finalOwnerId
        };

        const { data: result, error: saveError } = await supabaseAdmin
            .from('market_insights')
            .insert([dataToSave])
            .select()
            .single();

        if (saveError) {
            console.error('Save to Market Insights Error:', saveError);
            return NextResponse.json({ success: false, error: saveError.message || 'Failed to save to database' });
        }

        // 3. Tracking table
        await supabaseAdmin.from('scraped_urls').upsert({
            url: url,
            status: 'success'
        }, { onConflict: 'url' });

        return NextResponse.json({
            success: true,
            id: result.id,
            title: dataToSave.title
        });

    } catch (error: any) {
        console.error('Headless Import Sold API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Allow execution with secret or admin session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Fetch all properties that are NOT currently draft
        const { data: properties, error: fetchError } = await supabase
            .from('properties')
            .select('id, title, owner_phone, status')
            .neq('status', 'draft');

        if (fetchError) {
            throw fetchError;
        }

        const idsToDraft: string[] = [];
        for (const prop of (properties || [])) {
            const phone = (prop.owner_phone || '').trim();
            const hasValidPhone = phone !== '' && phone.toLowerCase() !== 'n/a' && phone.replace(/\D/g, '').length >= 6;
            if (!hasValidPhone) {
                idsToDraft.push(prop.id);
            }
        }

        if (idsToDraft.length > 0) {
            const { error: updateError } = await supabase
                .from('properties')
                .update({ status: 'draft', updated_at: new Date().toISOString() })
                .in('id', idsToDraft);

            if (updateError) {
                throw updateError;
            }
        }

        return NextResponse.json({
            success: true,
            totalChecked: (properties || []).length,
            updatedToDraftCount: idsToDraft.length,
            updatedIds: idsToDraft
        });
    } catch (e: any) {
        console.error('Error enforcing phone draft status:', e);
        return NextResponse.json({ error: e.message || 'Error enforcing phone draft status' }, { status: 500 });
    }
}

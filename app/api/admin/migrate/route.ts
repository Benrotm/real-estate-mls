
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const tourId = searchParams.get('id');

    if (secret !== 'force_migration_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    // Initialize Supabase with Service Role Key (Admin access)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        if (tourId) {
            // Specific Tour Fix
            const { data, error } = await supabase
                .from('virtual_tours')
                .select('*')
                .eq('id', tourId)
                .single();

            if (error) {
                return NextResponse.json({ error: 'Tour not found or DB error: ' + error.message }, { status: 404 });
            }

            // Force update to active
            const { error: updateError } = await supabase
                .from('virtual_tours')
                .update({ status: 'active' })
                .eq('id', tourId);

            if (updateError) {
                return NextResponse.json({ error: 'Update failed: ' + updateError.message }, { status: 500 });
            }

            return NextResponse.json({ success: true, message: `Tour ${tourId} set to active`, tour: data });
        } else {
            // Bulk Fix: Set ALL drafts to active?
            // Safer to do one by one, but for "Recover Visibility" task, maybe just fix the one.
            return NextResponse.json({ error: 'Please provide tour id' }, { status: 400 });
        }

    } catch (e: any) {
        return NextResponse.json({ error: 'Unexpected error: ' + e.message }, { status: 500 });
    }
}

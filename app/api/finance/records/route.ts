import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const viewTeam = searchParams.get('viewTeam') === 'true';

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let query = supabaseAdmin
            .from('financial_records')
            .select('*, profiles!financial_records_user_id_fkey(full_name)')
            .order('record_date', { ascending: false });

        if (viewTeam) {
            query = query.eq('agency_id', user.id);
        } else {
            query = query.eq('user_id', user.id);
        }

        const { data: records, error } = await query;

        if (error) {
            console.error('[Finance Records GET] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch financial records' }, { status: 500 });
        }

        return NextResponse.json({ records: records || [] });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { record_type, category, amount, description, record_date, is_agency_wide } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profile } = await supabaseAdmin.from('profiles').select('agency_id, plan_tier').eq('id', user.id).single();

        let targetAgencyId = profile?.agency_id || null;
        
        // If an admin creates a record and marks it agency wide, it's pinned to the agency
        if (is_agency_wide && profile?.plan_tier === 'enterprise') {
            targetAgencyId = user.id;
        }

        const { data, error } = await supabaseAdmin
            .from('financial_records')
            .insert({
                user_id: user.id,
                agency_id: targetAgencyId,
                record_type,
                category,
                amount: Number(amount),
                description,
                record_date: new Date(record_date).toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('[Finance Records POST] DB error:', error);
            return NextResponse.json({ error: 'Failed to log record' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Record logged successfully', record: data });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: rec } = await supabaseAdmin.from('financial_records').select('user_id, agency_id').eq('id', id).single();
        if (!rec) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (rec.user_id !== user.id && rec.agency_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await supabaseAdmin.from('financial_records').delete().eq('id', id);
        return NextResponse.json({ message: 'Record deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

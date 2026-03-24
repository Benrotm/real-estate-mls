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

        const safeRecords = records || [];

        // Auto-generation logic for recurring expenses
        const now = new Date();
        const autoRecords = [];
        const recordsToUpdate = [];

        for (const rec of safeRecords) {
            if (rec.is_recurring && rec.last_recurrence_date) {
                const lastDate = new Date(rec.last_recurrence_date);
                const monthDiff = (now.getFullYear() - lastDate.getFullYear()) * 12 + (now.getMonth() - lastDate.getMonth());
                
                if (monthDiff > 0) {
                    let nextRecurrenceDate = new Date(lastDate);
                    for (let i = 1; i <= monthDiff; i++) {
                        nextRecurrenceDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i, lastDate.getDate());
                        // Important: Only insert up to 'now' just in case of future dates
                        if (nextRecurrenceDate <= now) {
                            autoRecords.push({
                                user_id: rec.user_id,
                                agency_id: rec.agency_id,
                                record_type: rec.record_type,
                                category: rec.category,
                                amount: rec.amount,
                                description: rec.description,
                                record_date: nextRecurrenceDate.toISOString(),
                                is_recurring: false // The generated copies are not parents!
                            });
                        }
                    }
                    if (nextRecurrenceDate > lastDate && nextRecurrenceDate <= now) {
                        recordsToUpdate.push({ id: rec.id, last_recurrence_date: nextRecurrenceDate.toISOString() });
                        rec.last_recurrence_date = nextRecurrenceDate.toISOString(); 
                    }
                }
            }
        }

        if (autoRecords.length > 0) {
            const { data: inserted } = await supabaseAdmin.from('financial_records').insert(autoRecords).select('*, profiles!financial_records_user_id_fkey(full_name)');
            if (inserted) safeRecords.push(...inserted);

             for (const upd of recordsToUpdate) {
                await supabaseAdmin.from('financial_records').update({ last_recurrence_date: upd.last_recurrence_date }).eq('id', upd.id);
            }
            safeRecords.sort((a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime());
        }

        return NextResponse.json({ records: safeRecords });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { record_type, category, amount, description, record_date, is_agency_wide, is_recurring } = body;

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
                is_recurring: is_recurring || false,
                last_recurrence_date: is_recurring ? new Date(record_date).toISOString() : null
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

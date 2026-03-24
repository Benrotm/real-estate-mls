import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const agentIdParam = searchParams.get('agentId'); // Optional: for agency admin to view specific agent

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let query = supabaseAdmin
            .from('transactions')
            .select('*, profiles!transactions_agent_id_fkey(full_name)')
            .order('transaction_date', { ascending: false });

        if (agentIdParam) {
            // Admin is requesting a specific agent's deals. Verify admin auth.
            const { data: profile } = await supabaseAdmin.from('profiles').select('plan_tier, role, id').eq('id', user.id).single();
            if (profile?.plan_tier === 'enterprise' && profile?.role === 'agent') {
                // Check if the requested agent actually belongs to this agency
                const { data: targetProfile } = await supabaseAdmin.from('profiles').select('agency_id').eq('id', agentIdParam).single();
                if (targetProfile?.agency_id === user.id) {
                    query = query.eq('agent_id', agentIdParam);
                } else {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else {
            // Default: User sees their own deals
            const { data: profile } = await supabaseAdmin.from('profiles').select('agency_id').eq('id', user.id).single();
            // If they are an agency admin trying to see 'team deals' they would use the ROI tracker, but for now they just see their own if no param provided.
            // Wait, maybe agency teams should fetch all by agency_id if they request it. 
            const viewTeam = searchParams.get('viewTeam') === 'true';
            if (viewTeam) {
                query = query.eq('agency_id', user.id);
            } else {
                query = query.eq('agent_id', user.id);
            }
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('[Finance Transactions GET] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
        }

        return NextResponse.json({ transactions: transactions || [] });
    } catch (e: any) {
        console.error('[Finance Transactions GET] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { property_ref, lead_ref, transaction_type, transaction_value, commission_amount, transaction_date, notes } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch user's current agency_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('agency_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabaseAdmin
            .from('transactions')
            .insert({
                agent_id: user.id,
                agency_id: profile?.agency_id || null, // Record the agency at the time of transaction
                property_ref,
                lead_ref,
                transaction_type,
                transaction_value: Number(transaction_value),
                commission_amount: Number(commission_amount),
                transaction_date: new Date(transaction_date).toISOString(),
                notes
            })
            .select()
            .single();

        if (error) {
            console.error('[Finance Transactions POST] DB error:', error);
            return NextResponse.json({ error: 'Failed to log transaction' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Transaction logged securely', transaction: data });
    } catch (e: any) {
        console.error('[Finance Transactions POST] Fatal Error:', e);
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

        // Verify ownership or agency admin rights
        const { data: tx } = await supabaseAdmin.from('transactions').select('agent_id, agency_id').eq('id', id).single();
        if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (tx.agent_id !== user.id && tx.agency_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await supabaseAdmin.from('transactions').delete().eq('id', id);
        return NextResponse.json({ message: 'Transaction deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

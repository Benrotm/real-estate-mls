import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET: fetch activities for all team members
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const monthStr = searchParams.get('month'); // YYYY-MM
        const specificAgentId = searchParams.get('agentId'); // optional

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify agency access
        const { data: profile } = await supabaseAdmin.from('profiles').select('plan_tier, role').eq('id', user.id).single();
        if (profile?.plan_tier !== 'enterprise' || profile?.role !== 'agent') {
             return NextResponse.json({ error: 'Forbidden. Agency plan required.' }, { status: 403 });
        }

        // Get team member IDs
        const { data: teamMembers } = await supabaseAdmin.from('profiles').select('id, full_name').eq('agency_id', user.id);
        const teamIds = teamMembers?.map(m => m.id) || [];
        
        if (teamIds.length === 0) {
            return NextResponse.json({ teamActivities: [], members: [] });
        }

        let query = supabaseAdmin.from('agent_activities').select('*').in('agent_id', teamIds);

        let propQuery = supabaseAdmin.from('properties').select('created_at, owner_id').in('owner_id', teamIds);
        let leadQuery = supabaseAdmin.from('leads').select('created_at, agent_id').in('agent_id', teamIds);
        
        if (monthStr) {
            const year = parseInt(monthStr.split('-')[0]);
            const month = parseInt(monthStr.split('-')[1]);
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextMonthYear = month === 12 ? year + 1 : year;
            const endDateExcl = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`;

            query = query.gte('date', startDate).lt('date', endDateExcl);
            propQuery = propQuery.gte('created_at', `${startDate}T00:00:00Z`).lt('created_at', `${endDateExcl}T00:00:00Z`);
            leadQuery = leadQuery.gte('created_at', `${startDate}T00:00:00Z`).lt('created_at', `${endDateExcl}T00:00:00Z`);
        }

        if (specificAgentId && teamIds.includes(specificAgentId)) {
            query = query.eq('agent_id', specificAgentId);
        }

        const { data: manualActivities, error } = await query;
        if (error) throw error;

        const { data: props } = await propQuery;
        const { data: leads } = await leadQuery;

        return NextResponse.json({ 
            teamActivities: manualActivities || [], 
            members: teamMembers || [],
            autoListingsRaw: props || [],
            autoLeadsRaw: leads || [] 
        });
    } catch (e: any) {
        console.error('[Team Activities GET] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

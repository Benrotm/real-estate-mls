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

        if (monthStr) {
            query = query.like('date', `${monthStr}-%`);
        }
        
        if (specificAgentId && teamIds.includes(specificAgentId)) {
            query = query.eq('agent_id', specificAgentId);
        }

        const { data: manualActivities, error } = await query;
        if (error) throw error;

        // Optionally, auto-gen stats can be fetched for team, but for large arrays it's best batched.
        // For simplicity, we just aggregate manual activities. 
        // If they want team auto-gen, we query properties.owner_id in (teamIds).
        let propQuery = supabaseAdmin.from('properties').select('created_at, owner_id').in('owner_id', teamIds);
        let leadQuery = supabaseAdmin.from('leads').select('created_at, agent_id').in('agent_id', teamIds);
        
        if (monthStr) {
            propQuery = propQuery.gte('created_at', `${monthStr}-01T00:00:00Z`).lt('created_at', `${monthStr}-31T23:59:59Z`);
            leadQuery = leadQuery.gte('created_at', `${monthStr}-01T00:00:00Z`).lt('created_at', `${monthStr}-31T23:59:59Z`);
        }

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

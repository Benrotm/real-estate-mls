import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// GET: Fetch team members
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, plan_tier')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'agent' || profile.plan_tier !== 'enterprise') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: members, error } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, avatar_url, role, plan_tier, listings_count, email')
            .eq('agency_id', user.id);

        if (error) {
            console.error('[Team Members GET API] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
        }

        // Also fetch pending invitations to display in the same UI if needed
        const { data: invites } = await supabaseAdmin
            .from('team_invitations')
            .select('*')
            .eq('agency_id', user.id)
            .eq('status', 'pending');

        return NextResponse.json({ members: members || [], pendingInvites: invites || [] });
    } catch (e: any) {
        console.error('[Team Members GET API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a team member
export async function DELETE(req: Request) {
    try {
        const { memberId } = await req.json();

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify the member actually belongs to this agency
        const { data: member } = await supabaseAdmin
            .from('profiles')
            .select('agency_id')
            .eq('id', memberId)
            .single();

        if (member?.agency_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized to remove this member' }, { status: 403 });
        }

        // Unlink the member
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({ agency_id: null })
            .eq('id', memberId);

        if (error) {
            console.error('[Team Members DELETE API] update error:', error);
            return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Member removed successfully' });
    } catch (e: any) {
        console.error('[Team Members DELETE API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

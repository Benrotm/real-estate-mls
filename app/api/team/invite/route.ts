import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if the user is an agent and has the Enterprise (Full House Agency) plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, plan_tier')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'agent' || profile.plan_tier !== 'enterprise') {
            return NextResponse.json({ error: 'You must be on the Full House Agency plan to invite agents.' }, { status: 403 });
        }

        // Use Service Role to insert the invitation, bypassing RLS and allowing us to check if email exists if needed
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if invitation already exists and is pending
        const { data: existingInvite } = await supabaseAdmin
            .from('team_invitations')
            .select('id')
            .eq('agency_id', user.id)
            .eq('invitee_email', email)
            .eq('status', 'pending')
            .single();

        if (existingInvite) {
            return NextResponse.json({ error: 'An invitation is already pending for this email.' }, { status: 400 });
        }

        // Create the invitation
        const { data, error } = await supabaseAdmin
            .from('team_invitations')
            .insert({
                agency_id: user.id,
                invitee_email: email,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('[Team Invite API] Insert error:', error);
            return NextResponse.json({ error: 'Failed to create invitation.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Invitation sent successfully', invite: data });
    } catch (e: any) {
        console.error('[Team Invite API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

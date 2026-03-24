import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { inviteId } = await req.json();

        if (!inviteId) {
            return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Verify invitation exists and belongs to this user
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('team_invitations')
            .select('invitee_email, status')
            .eq('id', inviteId)
            .single();

        if (inviteError || !invite) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        if (invite.invitee_email !== user.email) {
            return NextResponse.json({ error: 'Unauthorized to decline this invitation' }, { status: 403 });
        }

        // Update status to declined
        const { error: updateError } = await supabaseAdmin
            .from('team_invitations')
            .update({ status: 'declined' })
            .eq('id', inviteId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Invitation declined' });
    } catch (e: any) {
        console.error('[Team Decline API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

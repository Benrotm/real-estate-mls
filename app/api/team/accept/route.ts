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

        // 1. Verify invitation exists and belongs to this user
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('team_invitations')
            .select('*')
            .eq('id', inviteId)
            .single();

        if (inviteError || !invite) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
        }

        if (invite.invitee_email !== user.email) {
            return NextResponse.json({ error: 'Unauthorized to accept this invitation' }, { status: 403 });
        }

        if (invite.status !== 'pending') {
            return NextResponse.json({ error: 'Invitation is no longer pending' }, { status: 400 });
        }

        // 2. Accept it inside a transaction-like flow (update status, then update profile)
        const { error: updateInviteError } = await supabaseAdmin
            .from('team_invitations')
            .update({ status: 'accepted' })
            .eq('id', inviteId);

        if (updateInviteError) {
            console.error('[Team Accept API] Update invite error:', updateInviteError);
            return NextResponse.json({ error: 'Failed to accept invitation.' }, { status: 500 });
        }

        // 3. Update the user's profile to link them to the agency
        const { error: updateProfileError } = await supabaseAdmin
            .from('profiles')
            .update({ agency_id: invite.agency_id })
            .eq('id', user.id);

        if (updateProfileError) {
            console.error('[Team Accept API] Update profile error:', updateProfileError);
            // Ideally we'd rollback the invite status here, but for now we log it.
            return NextResponse.json({ error: 'Failed to update user profile.' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Invitation accepted successfully' });
    } catch (e: any) {
        console.error('[Team Accept API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

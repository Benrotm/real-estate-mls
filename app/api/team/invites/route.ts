import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use service role to fetch invitations based on user email
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const userEmail = user.email.trim();

        const { data: invites, error } = await supabaseAdmin
            .from('team_invitations')
            .select(`
                id,
                agency_id,
                status,
                created_at
            `)
            .ilike('invitee_email', userEmail)
            .eq('status', 'pending');

        if (error) {
            console.error('[Team Invites GET API] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch invitations.' }, { status: 500 });
        }
        
        const safeInvites = invites || [];
        
        if (safeInvites.length > 0) {
            const agencyIds = safeInvites.map(i => i.agency_id);
            const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name')
                .in('id', agencyIds);
                
            safeInvites.forEach(invite => {
                const profile = profilesData?.find(p => p.id === invite.agency_id);
                (invite as any).profiles = profile || { full_name: 'Unknown Agency' };
            });
        }

        return NextResponse.json({ invites: safeInvites });
    } catch (e: any) {
        console.error('[Team Invites GET API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

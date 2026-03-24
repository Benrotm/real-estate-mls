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

        const { data: invites, error } = await supabaseAdmin
            .from('team_invitations')
            .select(`
                id,
                agency_id,
                status,
                created_at,
                profiles:agency_id (full_name)
            `)
            .eq('invitee_email', user.email)
            .eq('status', 'pending');

        if (error) {
            console.error('[Team Invites GET API] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch invitations.' }, { status: 500 });
        }

        return NextResponse.json({ invites: invites || [] });
    } catch (e: any) {
        console.error('[Team Invites GET API] Fatal Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

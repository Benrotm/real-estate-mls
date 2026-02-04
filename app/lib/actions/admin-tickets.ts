'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getTickets() {
    const supabase = await createClient();

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { error: 'Unauthorized' };
    }

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            profiles:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tickets:', error);
        return { error: 'Failed to fetch tickets' };
    }

    return { tickets };
}

export async function updateTicketStatus(ticketId: string, status: string, adminNotes?: string) {
    const supabase = await createClient();

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const updateData: any = { status };
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

    const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard/admin/tickets');
    return { success: true };
}

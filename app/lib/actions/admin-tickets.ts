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
            profiles:user_id (email, full_name),
            property:property_id (id, title, address)
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

import { getOrCreateSupportConversation, sendMessage } from './chat';
// We need startConversationWithUser to notify specific user (the claimer)
import { startConversationWithUser } from './chat';

export async function resolvePropertyClaim(ticketId: string, action: 'approve' | 'reject') {
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

    // Get Ticket
    const { data: ticket } = await supabase
        .from('tickets')
        .select('*, property:property_id(title)')
        .eq('id', ticketId)
        .single();

    if (!ticket) return { success: false, error: 'Ticket not found' };
    if (!ticket.property_id) return { success: false, error: 'No property associated with this ticket' };

    if (action === 'approve') {
        // 1. Update Property Owner
        const { error: updateError } = await supabase
            .from('properties')
            .update({ owner_id: ticket.user_id })
            .eq('id', ticket.property_id);

        if (updateError) return { success: false, error: 'Failed to transfer ownership: ' + updateError.message };

        // 2. Update Ticket Status
        await supabase.from('tickets').update({ status: 'resolved', admin_notes: 'Ownership claim approved.' }).eq('id', ticketId);

        // 3. Notify User
        const { conversationId } = await startConversationWithUser(ticket.user_id);
        if (conversationId) {
            await sendMessage(conversationId, user.id, `Good news! Your ownership claim for property "${ticket.property?.title || 'Unknown'}" has been APPROVED. You are now the owner.`);
        }

    } else {
        // Reject
        await supabase.from('tickets').update({ status: 'closed', admin_notes: 'Ownership claim rejected.' }).eq('id', ticketId);

        // Notify User
        const { conversationId } = await startConversationWithUser(ticket.user_id);
        if (conversationId) {
            await sendMessage(conversationId, user.id, `Update regarding your claim for property "${ticket.property?.title || 'Unknown'}": The claim has been rejected. Please provide more proof or contact support.`);
        }
    }

    revalidatePath('/dashboard/admin/tickets');
    return { success: true };
}

'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTicket(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const type = formData.get('type') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const imagesJson = formData.get('images') as string;

    let images: string[] = [];
    try {
        images = JSON.parse(imagesJson || '[]');
    } catch (e) {
        console.error('Failed to parse images JSON', e);
    }

    if (!subject || !description) {
        return { success: false, error: 'Subject and description are required.' };
    }

    const { error } = await supabase
        .from('tickets')
        .insert({
            user_id: user.id,
            type,
            subject,
            description,
            status: 'open',
            priority: 'medium', // Default
            images: images
        });

    if (error) {
        console.error('Error creating ticket:', error);
        return { success: false, error: 'Failed to create ticket.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

import { getOrCreateSupportConversation, sendMessage } from './chat';

export async function submitPropertyReport(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const propertyId = formData.get('propertyId') as string;
    const type = formData.get('reportType') as string; // 'irregularity' or 'claim'
    const description = formData.get('description') as string;

    if (!propertyId || !description) {
        return { success: false, error: 'Description is required.' };
    }

    // Get Property Details for the message
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('title, address')
        .eq('id', propertyId)
        .single();

    if (propError || !property) {
        return { success: false, error: 'Property not found.' };
    }

    let subjectPrefix = 'Report';
    if (type === 'claim') subjectPrefix = 'Ownership Claim';
    else if (type === 'sold_rented') subjectPrefix = 'Report: Sold/Rented';
    else if (type === 'not_owner') subjectPrefix = 'Report: Broker not Owner';

    const subject = `${subjectPrefix}: ${property.title}`;

    // 1. Create Ticket
    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
            user_id: user.id,
            type: 'property_report',
            subject,
            description: `Type: ${type}\nProperty ID: ${propertyId}\n\n${description}`,
            status: 'open',
            priority: type === 'claim' ? 'high' : 'medium',
            property_id: propertyId
        })
        .select()
        .single();

    if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        return { success: false, error: ticketError.message || 'Failed to submit report.' };
    }

    // 2. Notify via Chat
    const { conversationId, error: chatError } = await getOrCreateSupportConversation();

    if (conversationId) {
        const messageContent = type === 'claim'
            ? `I have claimed ownership of property "${property.title}". Ticket #${ticket.id.slice(0, 8)} created.`
            : `I have reported an issue with property "${property.title}". Ticket #${ticket.id.slice(0, 8)} created.`;

        await sendMessage(conversationId, user.id, messageContent);
    } else {
        console.warn('Failed to start chat for report:', chatError);
    }

    revalidatePath(`/properties/${propertyId}`);
    return { success: true };
}

export async function getUserTickets() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { tickets: [], error: 'Unauthorized' };
    }

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            property:property_id (id, title, address)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user tickets:', error);
        return { tickets: [], error: 'Failed to fetch tickets' };
    }

    return { tickets };
}

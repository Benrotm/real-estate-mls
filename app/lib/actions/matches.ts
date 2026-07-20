'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function upsertMatchStatus(leadId: string, propertyId: string, status: string, notes?: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const payload: any = {
        lead_id: leadId,
        property_id: propertyId,
        status: status,
        updated_at: new Date().toISOString()
    };
    if (notes !== undefined) {
        payload.agent_notes = notes;
    }

    // Attempt to update first (or insert via onConflict)
    const { data, error } = await supabase
        .from('lead_property_matches')
        .upsert(payload, { onConflict: 'lead_id,property_id' })
        .select()
        .single();

    if (error) {
        console.error('Error upserting match status:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/agent/leads/${leadId}`);
    revalidatePath(`/dashboard/agent/leads/${leadId}/matches`);

    return { success: true, data };
}

export async function addPropertyToLeadMatchingByLookup(propertyId: string, leadIdentifier: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const cleanInput = leadIdentifier.trim().replace(/^#/, '');
    const cleanPhone = cleanInput.replace(/\D/g, '');

    const adminSupabase = createAdminClient();
    
    let lead: any = null;

    // Check by exact UUID if 36 chars
    if (cleanInput.length === 36) {
        const { data } = await adminSupabase.from('leads').select('id, name, phone').eq('id', cleanInput).maybeSingle();
        lead = data;
    }

    // Check by substring ID or friendly search
    if (!lead) {
        const { data } = await adminSupabase.from('leads').select('id, name, phone').ilike('id', `%${cleanInput}%`).limit(1).maybeSingle();
        lead = data;
    }

    // Check by phone number
    if (!lead && cleanPhone.length >= 5) {
        const { data } = await adminSupabase.from('leads').select('id, name, phone').ilike('phone', `%${cleanPhone}%`).limit(1).maybeSingle();
        lead = data;
    }

    if (!lead) {
        return { error: `No Lead found matching "${leadIdentifier}". Please check the phone number or Lead ID.` };
    }

    const res = await upsertMatchStatus(lead.id, propertyId, 'verify');
    if (res.error) return { error: res.error };

    return { success: true, leadName: lead.name, leadId: lead.id };
}

export async function bulkUpsertMatchStatus(leadId: string, propertyIds: string[], status: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const payloads = propertyIds.map(propertyId => ({
        lead_id: leadId,
        property_id: propertyId,
        status: status,
        updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('lead_property_matches')
        .upsert(payloads, { onConflict: 'lead_id,property_id' })
        .select();

    if (error) {
        console.error('Error bulk upserting match status:', error);
        return { error: error.message };
    }

    revalidatePath(`/dashboard/agent/leads/${leadId}`);
    revalidatePath(`/dashboard/agent/leads/${leadId}/matches`);

    return { success: true, data };
}

export async function getLeadMatches(leadId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lead_property_matches')
        .select(`
            id,
            status,
            agent_notes,
            created_at,
            updated_at,
            property:properties (*)
        `)
        .eq('lead_id', leadId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching lead matches:', error);
        return { matches: [] };
    }

    return { matches: data || [] };
}

export async function getPublicMatchesByToken(token: string) {
    const supabase = createAdminClient(); // Bypass RLS for public token access

    // 1. Find lead by token
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('public_share_token', token)
        .single();

    if (leadError || !lead) {
        return { error: 'Invalid or expired link' };
    }

    // 2. Find matches sent to lead
    const { data: matches, error: matchError } = await supabase
        .from('lead_property_matches')
        .select(`
            id,
            status,
            property_id,
            property:properties (*)
        `)
        .eq('lead_id', lead.id)
        .in('status', ['saved', 'sent', 'interested', 'not_interested', 'visit_scheduled', 'negotiation', 'sold']);

    if (matchError) {
        console.error('Error fetching public matches:', matchError);
        return { error: 'Could not fetch properties' };
    }

    return { lead, matches: matches || [] };
}

export async function updatePublicMatchStatus(token: string, matchId: string, newStatus: 'interested' | 'not_interested' | 'visit_scheduled' | 'sold') {
    const supabase = createAdminClient();

    // Verify token corresponds to lead
    const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('public_share_token', token)
        .single();

    if (!lead) return { error: 'Invalid token' };

    // Verify match belongs to lead
    const { data: match } = await supabase
        .from('lead_property_matches')
        .select('id')
        .eq('id', matchId)
        .eq('lead_id', lead.id)
        .single();

    if (!match) return { error: 'Invalid match record' };

    const { error } = await supabase
        .from('lead_property_matches')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', matchId);

    if (error) {
        console.error('Error updating public match status:', error);
        return { error: error.message };
    }

    revalidatePath(`/share/matches/${token}`);
    
    return { success: true };
}

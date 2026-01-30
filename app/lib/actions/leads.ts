'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface LeadData {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    source?: string;
    notes?: string;

    preference_type?: string;
    preference_listing_type?: string;
    preference_location_county?: string;
    preference_location_city?: string;
    preference_location_area?: string;

    budget_min?: number;
    budget_max?: number;
    currency?: string;

    preference_rooms_min?: number;
    preference_rooms_max?: number;
    preference_bedrooms_min?: number;
    preference_surface_min?: number;

    preference_features?: string[];
}

export async function createLead(data: LeadData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase.from('leads').insert({
        ...data,
        agent_id: user.id
    });

    if (error) {
        console.error('Create Lead Error:', error);
        throw new Error('Failed to create lead');
    }

    revalidatePath('/dashboard/agent/leads');
    redirect('/dashboard/agent/leads');
}

export async function updateLead(leadId: string, data: LeadData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Security check handled by RLS, but explicit check is good
    const { error } = await supabase
        .from('leads')
        .update(data)
        .eq('id', leadId)
        .eq('agent_id', user.id);

    if (error) {
        console.error('Update Lead Error:', error);
        throw new Error('Failed to update lead');
    }

    revalidatePath('/dashboard/agent/leads');
    // We might not always redirect if it's a modal, but standard flow:
    // redirect('/dashboard/agent/leads');
}

export async function deleteLead(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('agent_id', user.id);

    if (error) throw new Error('Failed to delete lead');
    revalidatePath('/dashboard/agent/leads');
}

export async function fetchLeads() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch Leads Error:', error);
        return [];
    }
    return data;
}

export async function fetchLead(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('agent_id', user.id)
        .single();

    if (error) return null;
    return data;
}

// Notes Actions
export async function createNote(leadId: string, content: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    const { error } = await supabase.from('lead_notes').insert({
        lead_id: leadId,
        created_by: user.id,
        content
    });

    if (error) throw new Error('Failed to create note');
    revalidatePath(`/dashboard/agent/leads/${leadId}`);
}

export async function fetchNotes(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return [];

    const { data, error } = await supabase
        .from('lead_notes')
        .select(`
            *,
            author:created_by(full_name, avatar_url)
        `)
        .eq('lead_id', leadId)
        // We need to ensure the user owns the lead to view notes, but RLS handles this policy-wise.
        // However, the join on 'created_by' refers to profiles.
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch Notes Error:', error);
        return [];
    }
    return data;
}

'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { calculateLeadScore } from './scoring';
import { LeadData } from '@/app/lib/types';

export async function createLead(data: LeadData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Deduplication check: Check for identical lead created in the last 10 seconds
    const { data: recentLead } = await supabase
        .from('leads')
        .select('id, created_at, name')
        .eq('agent_id', user.id)
        .eq('created_by', user.id)
        .eq('name', data.name) // Check by name match
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentLead) {
        const timeDiff = new Date().getTime() - new Date(recentLead.created_at).getTime();
        // 10 second window to catch double submissions
        if (timeDiff < 10000) {
            console.log('Duplicate lead detected, returning existing ID.');
            return { success: true, lead: { id: recentLead.id } };
        }
    }

    // Calculate initial score
    const score = await calculateLeadScore(data);

    // Clean data - remove undefined/null values that might cause issues if not nullable in DB
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([k, v]) => k !== 'notes' && v !== undefined && v !== null && v !== '')
    );

    const { data: lead, error } = await supabase.from('leads').insert({
        ...cleanData,
        score,
        agent_id: user.id,
        created_by: user.id,
        // Ensure default status if missing
        status: data.status || 'new',
        // Ensure currency default
        currency: data.currency || 'EUR'
    })
        .select()
        .single();

    if (error) {
        console.error('Create Lead Error Full:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create lead: ${error.message} (${error.code})`);
    }

    // Handle initial note if present
    if (lead && data.notes && data.notes.trim()) {
        await supabase.from('lead_notes').insert({
            lead_id: lead.id,
            created_by: user.id,
            content: data.notes
        });
    }

    // Log activity
    if (lead) {
        await supabase.from('lead_activities').insert({
            lead_id: lead.id,
            type: 'created',
            description: 'Lead created',
            created_by: user.id
        });
    }

    revalidatePath('/dashboard/agent/leads');
    // Return success with minimal data to avoid serialization issues
    // The full lead object might contain types that Server Actions struggle to serialize (e.g. some Date formats or large JSONs)
    return { success: true, lead: { id: lead.id } };
}

export async function updateLead(leadId: string, data: LeadData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Check if user is super_admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    // Recalculate score on update
    const score = await calculateLeadScore(data);

    // Clean data - Remove known read-only fields and relations that shouldn't be updated
    const readOnlyFields = [
        'id', 'created_at', 'updated_at', 'creator', 'agent_id', 'created_by', 'notes'
    ];

    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([k, v]) =>
            !readOnlyFields.includes(k) &&
            v !== undefined &&
            v !== null &&
            v !== ''
        )
    );

    // Build query
    let query = supabase
        .from('leads')
        .update({ ...cleanData, score })
        .eq('id', leadId);

    // Only restrict by agent_id if NOT super_admin
    if (!isSuperAdmin) {
        query = query.eq('agent_id', user.id);
    }

    const { error } = await query;

    if (error) {
        console.error('Update Lead Error Full:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update lead: ${error.message} (${error.code})`);
    }

    revalidatePath('/dashboard/agent/leads');
    revalidatePath('/dashboard/admin/leads');
    return { success: true };
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
        .select('*, creator:created_by(full_name)')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch Leads Error:', error);
        return [];
    }
    return data || [];
}

export async function getLeadsCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user.id);

    if (error) {
        console.error('Error fetching leads count:', error);
        return 0;
    }
    return count || 0;
}

export async function fetchLead(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return null;

    // Check if user is super_admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isSuperAdmin = profile?.role === 'super_admin';

    let query = supabase
        .from('leads')
        .select('*, creator:created_by(full_name)')
        .eq('id', leadId);

    // Only restrict by agent_id if NOT super_admin
    if (!isSuperAdmin) {
        query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query.single();

    if (error) return null;
    return data;
}

// Notes Actions
export async function createNote(leadId: string, content: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    // Deduplication check: Check for identical note in the last 5 seconds
    const { data: recentNote } = await supabase
        .from('lead_notes')
        .select('created_at, content')
        .eq('lead_id', leadId)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentNote) {
        const timeDiff = new Date().getTime() - new Date(recentNote.created_at).getTime();
        if (timeDiff < 5000 && recentNote.content === content) {
            console.log('Duplicate note detected, skipping insert.');
            // Return early as if successful to avoid client error
            revalidatePath(`/dashboard/agent/leads/${leadId}`);
            return;
        }
    }

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

    return data || [];
}

export async function fetchActivities(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return [];

    const { data, error } = await supabase
        .from('lead_activities')
        .select('*, creator:created_by(full_name)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Fetch Activities Error:', error);
        return [];
    }
    return data || [];
}

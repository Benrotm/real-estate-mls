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

    // Clean data - remove undefined/null values. We ALLOW empty strings so users can clear fields.
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([k, v]) => k !== 'notes' && v !== undefined && v !== null)
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
        return { success: false, error: `Failed to create lead: ${error.message} (${error.code})` };
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
            v !== null
        )
    );

    // Build query
    let query = supabase
        .from('leads')
        .update({ ...cleanData, score })
        .eq('id', leadId);

    // The RLS policy natively handles if this user is allowed to update (owner or manager)

    const { error } = await query;

    if (error) {
        console.error('Update Lead Error Full:', JSON.stringify(error, null, 2));
        return { success: false, error: `Failed to update lead: ${error.message} (${error.code})` };
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
        .eq('id', leadId);

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
        .select(`
            *,
            creator:created_by(full_name),
            agent:agent_id(id, full_name, email, phone, avatar_url)
        `)
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
        .select('*', { count: 'exact', head: true });

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

    // The RLS policy natively handles if this user is allowed to view (team member or manager)

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

    // Auto-update lead status if CLOSED or LOST tag was selected
    const upperContent = content.toUpperCase();
    if (upperContent.includes('[CLOSED]')) {
        await supabase.from('leads').update({ status: 'closed' }).eq('id', leadId);
    } else if (upperContent.includes('[LOST]')) {
        await supabase.from('leads').update({ status: 'lost' }).eq('id', leadId);
    }

    revalidatePath(`/dashboard/agent/leads/${leadId}`);
    revalidatePath('/dashboard/agent/leads');
}

export async function updateLeadStatus(leadId: string, status: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
    if (error) throw new Error(`Failed to update lead status: ${error.message}`);

    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'status_change',
        description: `Status updated to ${status}`,
        created_by: user.id
    });

    revalidatePath(`/dashboard/agent/leads/${leadId}`);
    revalidatePath(`/dashboard/admin/leads/${leadId}`);
    revalidatePath('/dashboard/agent/leads');
    revalidatePath('/dashboard/admin/leads');
    revalidatePath('/dashboard/agent/pipeline');
    revalidatePath('/dashboard/admin/pipeline');
    return { success: true };
}

export async function logLeadActivity(leadId: string, type: string, description: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Unauthorized');

    const { error } = await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type,
        description,
        created_by: user.id
    });

    if (error) {
        console.error('Failed to log lead activity:', error);
        throw new Error('Failed to log lead activity');
    }
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

export async function getUnlockedLeadIds() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from('credit_transactions')
        .select('metadata')
        .eq('user_id', user.id);

    if (error || !data) {
        return [];
    }

    return data
        .map(t => (t.metadata as any)?.lead_id)
        .filter(Boolean) as string[];
}

export async function unlockLead(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 1. Verify that the lead exists and belongs to the user (agent_id = user.id)
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, agent_id, name')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        return { success: false, error: 'Lead not found.' };
    }

    if (lead.agent_id !== user.id) {
        return { success: false, error: 'Access denied.' };
    }

    // 2. Check if lead is already unlocked
    const unlockedIds = await getUnlockedLeadIds();
    if (unlockedIds.includes(leadId)) {
        return { success: true, message: 'Lead is already unlocked.' };
    }

    // 3. Fetch cost of leads_access
    const { data: costData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (costData?.setting_value as Record<string, number>) || {};
    const cost = costsMap['leads_access'] !== undefined ? costsMap['leads_access'] : 5;

    // 4. Deduct user credits
    const { deductUserCredits } = await import('./credits');
    const deductRes = await deductUserCredits(
        cost, 
        `Deblocare Lead: ${lead.name || 'Client Interest'}`,
        { lead_id: leadId }
    );

    if (deductRes.error) {
        return { 
            success: false, 
            error: deductRes.error, 
            insufficient: deductRes.insufficient 
        };
    }

    // Log lead activity for the unlock event
    try {
        await supabase.from('lead_activities').insert({
            lead_id: leadId,
            type: 'system',
            description: `Lead unlocked utilizing ${cost} credits.`,
            created_by: user.id
        });
    } catch (e) {
        console.error('Error logging unlock activity:', e);
    }

    revalidatePath('/dashboard/owner/leads');
    return { success: true };
}

export async function createLeadPublic(agentId: string, data: LeadData) {
    const { createAdminClient } = await import('@/app/lib/supabase/admin');
    const supabase = createAdminClient();

    // Deduplication check: Check for identical lead created in the last 10 seconds
    const { data: recentLead } = await supabase
        .from('leads')
        .select('id, created_at, name')
        .eq('agent_id', agentId)
        .eq('name', data.name)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentLead) {
        const timeDiff = new Date().getTime() - new Date(recentLead.created_at).getTime();
        if (timeDiff < 10000) {
            console.log('Duplicate public lead detected, returning existing ID.');
            return { success: true, lead: { id: recentLead.id } };
        }
    }

    // Calculate initial score
    const score = await calculateLeadScore(data);

    // Clean data - remove undefined/null values
    const cleanData = Object.fromEntries(
        Object.entries(data).filter(([k, v]) => k !== 'notes' && v !== undefined && v !== null)
    );

    const { data: lead, error } = await supabase.from('leads').insert({
        ...cleanData,
        score,
        agent_id: agentId,
        created_by: agentId,
        status: 'new',
        source: 'Shared Link Form',
        currency: data.currency || 'EUR'
    })
        .select()
        .single();

    if (error) {
        console.error('Create Public Lead Error:', error);
        return { success: false, error: `Failed to create lead: ${error.message}` };
    }

    // Handle initial note if present
    if (lead && data.notes && data.notes.trim()) {
        await supabase.from('lead_notes').insert({
            lead_id: lead.id,
            content: data.notes,
            created_by: agentId
        });
    }

    return { success: true, lead };
}

export async function getOrCreateClientSelfServiceLead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Check if client already has a lead
    const { data: existingLead } = await supabase
        .from('leads')
        .select('*')
        .or(`created_by.eq.${user.id},email.eq.${user.email}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (existingLead) {
        return { success: true, lead: existingLead };
    }

    // Get user profile name and phone
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

    // Create a self-service lead profile for this client
    const defaultLead: any = {
        name: profile?.full_name || user.email?.split('@')[0] || 'Client Market',
        email: user.email,
        phone: profile?.phone || '',
        status: 'new',
        source: 'Self-Service Market Client',
        agent_id: user.id,
        created_by: user.id,
        preference_type: 'Apartment',
        currency: 'EUR'
    };

    const { data: newLead, error } = await supabase
        .from('leads')
        .insert(defaultLead)
        .select()
        .single();

    if (error) {
        console.error('Error creating self-service client lead:', error);
        return { error: error.message };
    }

    return { success: true, lead: newLead };
}

export async function submitClientNoAgencyFromInvite(agentId: string, data: {
    name: string;
    phone: string;
    email: string;
    password?: string;
    leadData: LeadData;
}) {
    const { createAdminClient } = await import('@/app/lib/supabase/admin');
    const { createClient } = await import('@/app/lib/supabase/server');
    const adminSupabase = createAdminClient();

    const cleanEmail = data.email.trim().toLowerCase();
    const password = data.password?.trim() || 'ImobumClient2026!';
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if user profile with this email already exists
    const { data: existingUsers } = await adminSupabase
        .from('profiles')
        .select('id, role')
        .eq('email', cleanEmail)
        .limit(1);

    let userId: string;

    if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        await adminSupabase.from('profiles').update({
            referred_by: agentId,
            find_self_from_owner: data.leadData.search_direct_owner !== false,
            wants_agent_help: data.leadData.search_with_agent !== false
        }).eq('id', userId);
    } else {
        // Create user in Auth
        const { data: authUser, error: authErr } = await adminSupabase.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
                first_name: firstName,
                last_name: lastName,
                phone: data.phone.trim(),
                role: 'client_no_agency',
                referred_by: agentId,
                find_self_from_owner: data.leadData.search_direct_owner !== false,
                wants_agent_help: data.leadData.search_with_agent !== false
            }
        });

        if (authErr && !authUser?.user) {
            return { success: false, error: authErr.message };
        }

        userId = authUser.user!.id;

        // Upsert profile for new client
        await adminSupabase.from('profiles').upsert({
            id: userId,
            email: cleanEmail,
            full_name: data.name.trim(),
            phone: data.phone.trim(),
            role: 'client_no_agency',
            referred_by: agentId,
            is_approved: false,
            find_self_from_owner: data.leadData.search_direct_owner !== false,
            wants_agent_help: data.leadData.search_with_agent !== false
        });
    }

    // Insert lead preferences for AI Matching engine
    const score = await calculateLeadScore(data.leadData);
    const cleanLeadData = Object.fromEntries(
        Object.entries(data.leadData).filter(([k, v]) => k !== 'notes' && v !== undefined && v !== null)
    );

    const { error: leadErr } = await adminSupabase.from('leads').insert({
        ...cleanLeadData,
        score,
        name: data.name.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        agent_id: agentId,
        created_by: userId,
        status: 'new',
        source: 'Client Self-Service Referral Form',
        currency: data.leadData.currency || 'EUR',
        find_self_from_owner: data.leadData.search_direct_owner !== false,
        wants_agent_help: data.leadData.search_with_agent !== false
    });

    if (leadErr) {
        console.error('Error creating lead from client referral invite:', leadErr);
    }

    // Auto sign-in user session
    const supabase = await createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
    });

    if (signInErr) {
        console.warn('Auto sign-in warning:', signInErr.message);
    }

    return {
        success: true,
        redirectUrl: '/dashboard/client/ai-matching'
    };
}


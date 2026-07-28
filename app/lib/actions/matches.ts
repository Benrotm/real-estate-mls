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

    const adminSupabase = createAdminClient();

    let dbStatus = status;
    if (status === 'offer_made') dbStatus = 'negotiation';
    if (status === 'curate') dbStatus = 'to_verify';

    const payload: any = {
        lead_id: leadId,
        property_id: propertyId,
        status: dbStatus,
        updated_at: new Date().toISOString()
    };
    if (notes !== undefined) {
        payload.agent_notes = notes;
    }

    // Attempt to update first (or insert via onConflict)
    const { data, error } = await adminSupabase
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
    revalidatePath('/dashboard/client/ai-matching');

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

    // Fetch leads to perform safe string & ID matching (bypassing UUID ilike type cast errors)
    const { data: allLeads } = await adminSupabase
        .from('leads')
        .select('id, name, phone');

    if (allLeads && allLeads.length > 0) {
        const queryLower = cleanInput.toLowerCase();
        
        lead = allLeads.find(l => {
            const lId = (l.id || '').toLowerCase();
            const lPhone = (l.phone || '').replace(/\D/g, '');
            const lName = (l.name || '').toLowerCase();

            if (lId === queryLower) return true;
            if (queryLower.length >= 4 && lId.includes(queryLower)) return true;
            if (cleanPhone.length >= 5 && lPhone.includes(cleanPhone)) return true;
            if (lName.includes(queryLower)) return true;
            return false;
        });
    }

    if (!lead) {
        return { error: `No Lead found matching "${leadIdentifier}". Please check the phone number or Lead ID.` };
    }

    // Save with status 'to_verify' (matching lead_property_matches check constraint)
    const res = await upsertMatchStatus(lead.id, propertyId, 'to_verify');
    if (res.error) return { error: res.error };

    return { success: true, leadName: lead.name, leadId: lead.id };
}

export async function bulkUpsertMatchStatus(leadId: string, propertyIds: string[], status: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    let dbStatus = status;
    if (status === 'offer_made') dbStatus = 'negotiation';
    if (status === 'curate') dbStatus = 'to_verify';

    const payloads = propertyIds.map(propertyId => ({
        lead_id: leadId,
        property_id: propertyId,
        status: dbStatus,
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
    const { data: { user } } = await supabase.auth.getUser();

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

    let matches = data || [];

    // Sync property_favorites for current user to lead_property_matches with status 'saved'
    if (user) {
        try {
            const { data: userFavs } = await supabase
                .from('property_favorites')
                .select('property_id, property:properties (*)')
                .eq('user_id', user.id);

            if (userFavs && userFavs.length > 0) {
                const existingPropIds = new Set(matches.map((m: any) => m.property_id || m.property?.id));
                const adminSupabase = createAdminClient();

                for (const fav of userFavs) {
                    if (fav.property && fav.property_id && !existingPropIds.has(fav.property_id)) {
                        const { data: newMatch } = await adminSupabase
                            .from('lead_property_matches')
                            .upsert({
                                lead_id: leadId,
                                property_id: fav.property_id,
                                status: 'saved',
                                updated_at: new Date().toISOString()
                            }, { onConflict: 'lead_id,property_id' })
                            .select(`
                                id,
                                status,
                                agent_notes,
                                created_at,
                                updated_at,
                                property:properties (*)
                            `)
                            .maybeSingle();

                        if (newMatch) {
                            matches.unshift(newMatch);
                        }
                    }
                }
            }
        } catch (favErr) {
            console.error('Error syncing user favorites to matches:', favErr);
        }
    }

    return { matches };
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

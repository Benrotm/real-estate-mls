'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface PresentationContractInput {
    leadId: string;
    propertyId: string;
    negotiatedCommissionType: 'percent' | 'fixed';
    negotiatedCommissionBuy: number;
    negotiatedCommissionRent: number;
    calculatedCommission: number;
    propertyPrice: number;
    contractSerial: string;
    contractNumber: string;
}

/**
 * Creates a new presentation contract and logs a daily activity.
 */
export async function createPresentationContract(input: PresentationContractInput) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Fetch broker's profile to extract Persoană Juridică (Firma) details
        const { data: brokerProfile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileErr || !brokerProfile) {
            return { success: false, error: 'Broker profile not found. Please configure your profile first.' };
        }

        const agentDetails = {
            id: user.id,
            fullName: brokerProfile.full_name || '',
            phone: brokerProfile.phone || '',
            email: brokerProfile.email || '',
            companyName: brokerProfile.company_name || '',
            companyCui: brokerProfile.company_cui || '',
            companyRegCom: brokerProfile.company_reg_com || '',
            companyAddress: brokerProfile.company_address || '',
            companyRepresentative: brokerProfile.company_representative || brokerProfile.full_name || '',
            isCompany: !!brokerProfile.is_company
        };

        // 2. Fetch lead details (trying standard query first to check ownership/access)
        let lead = null;
        let hasAccess = false;

        const { data: userLead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', input.leadId)
            .maybeSingle();

        if (userLead) {
            lead = userLead;
            hasAccess = true;
        } else {
            // Check if it exists via admin client (bypassing RLS)
            const { createAdminClient } = await import('@/app/lib/supabase/admin');
            const adminSupabase = createAdminClient();
            const { data: adminLead } = await adminSupabase
                .from('leads')
                .select('*')
                .eq('id', input.leadId)
                .maybeSingle();

            if (adminLead) {
                lead = adminLead;
                hasAccess = false;
            }
        }

        if (!lead) {
            return { success: false, error: 'Lead-ul cu acest ID nu a fost găsit în baza de date.' };
        }

        let clientDetails;
        let clientId = null;

        if (hasAccess) {
            // Populate contact data normally
            let cnpValue = lead.cnp || '';
            let idSeriesValue = lead.id_series_number || '';
            let idDocTypeValue = lead.id_document_type || 'C.I.';

            if (lead.email) {
                const { data: clientProfile } = await supabase
                    .from('profiles')
                    .select('id, cnp, id_series_number')
                    .eq('email', lead.email)
                    .maybeSingle();

                if (clientProfile) {
                    clientId = clientProfile.id;
                    cnpValue = clientProfile.cnp || cnpValue;
                    idSeriesValue = clientProfile.id_series_number || idSeriesValue;
                }
            }

            clientDetails = {
                id: clientId,
                leadId: lead.id,
                name: lead.name || '',
                phone: lead.phone || '',
                email: lead.email || '',
                idDocumentType: idDocTypeValue,
                idSeriesNumber: idSeriesValue,
                cnp: cnpValue
            };
        } else {
            // Standard data is hidden/not retrieved because lead is owned by someone else.
            // Client details will be left blank and introduced manually by the client.
            clientDetails = {
                id: null,
                leadId: lead.id,
                name: '',
                phone: '',
                email: '',
                idDocumentType: '',
                idSeriesNumber: '',
                cnp: ''
            };
        }

        // 3. Insert the presentation contract record
        const { data: contract, error: insertErr } = await supabase
            .from('presentation_contracts')
            .insert({
                agent_id: user.id,
                lead_id: lead.id,
                client_id: clientId,
                property_id: input.propertyId,
                contract_number: input.contractNumber,
                contract_serial: input.contractSerial || 'VZN',
                status: 'sent',
                negotiated_commission_type: input.negotiatedCommissionType,
                negotiated_commission_buy: input.negotiatedCommissionBuy,
                negotiated_commission_rent: input.negotiatedCommissionRent,
                calculated_commission: input.calculatedCommission,
                property_price: input.propertyPrice,
                agent_details: agentDetails,
                client_details: clientDetails
            })
            .select()
            .single();

        if (insertErr || !contract) {
            console.error('Error creating presentation contract:', insertErr);
            return { success: false, error: insertErr?.message || 'Failed to insert contract.' };
        }

        // 4. Increment Daily Activity "Lead Appts Realised" automatically
        try {
            const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Fetch current activity if exists
            const { data: currentAct } = await supabase
                .from('agent_activities')
                .select('quantity')
                .eq('agent_id', user.id)
                .eq('date', todayStr)
                .eq('activity_type', 'lead_appt_realised')
                .maybeSingle();

            const currentQty = currentAct?.quantity || 0;

            await supabase
                .from('agent_activities')
                .upsert({
                    agent_id: user.id,
                    date: todayStr,
                    activity_type: 'lead_appt_realised',
                    quantity: currentQty + 1
                }, {
                    onConflict: 'agent_id, date, activity_type'
                });
        } catch (actErr) {
            console.error('Failed to log daily activity:', actErr);
        }

        // Log lead activity event
        try {
            await supabase.from('lead_activities').insert({
                lead_id: lead.id,
                type: 'contract',
                description: `S-a generat Fisa de Vizionare nr. ${input.contractSerial}/${input.contractNumber} pentru proprietatea ${input.propertyId}`,
                created_by: user.id
            });
        } catch (e) {
            console.error(e);
        }

        revalidatePath('/dashboard/agent/presentation-contracts');
        revalidatePath(`/dashboard/agent/leads/${lead.id}`);
        
        return { success: true, contractId: contract.id };

    } catch (err: any) {
        console.error('Critical error in createPresentationContract:', err);
        return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
}

/**
 * Fetches a presentation contract by ID.
 */
export async function getPresentationContract(id: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('presentation_contracts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching presentation contract:', error);
        return { success: false, error: error.message };
    }

    // Fetch property friendly details
    let propertyDetails = null;
    if (data.property_id) {
        const { data: propData } = await supabase
            .from('properties')
            .select('title, address, personal_property_id, price, currency')
            .eq('id', data.property_id)
            .maybeSingle();
        if (propData) {
            propertyDetails = propData;
        }
    }

    return { 
        success: true, 
        contract: {
            ...data,
            property: propertyDetails
        }
    };
}

/**
 * Fetches all presentation contracts for the agent.
 * If user is agency/enterprise manager, fetches team member contracts too.
 */
export async function getPresentationContractsForAgent() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Check if user is an agency manager / enterprise tier
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan_tier')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return { success: false, error: 'Profile not found' };
    }

    const isAgencyManager = profile.role === 'agent' && profile.plan_tier === 'enterprise';

    let query = supabase
        .from('presentation_contracts')
        .select('*');

    if (isAgencyManager) {
        // Fetch team members
        const { data: members } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('agency_id', user.id);

        const memberIds = members ? members.map(m => m.user_id) : [];
        query = query.in('agent_id', [user.id, ...memberIds]);
    } else {
        query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agent presentation contracts:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contracts: data || [] };
}

/**
 * Fetches all presentation contracts for admin overview.
 */
export async function getPresentationContractsForAdmin() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return { success: false, error: 'Access denied' };
    }

    const { data, error } = await supabase
        .from('presentation_contracts')
        .select(`
            *,
            agent:agent_id(id, full_name, email, phone)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin presentation contracts:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contracts: data || [] };
}

/**
 * Updates signatures on a presentation contract.
 * Also supports updating and syncing client details if they were input before signing.
 */
export async function updatePresentationSignatures(
    id: string,
    updates: { 
        agent_signature?: string; 
        client_signature?: string;
        client_details?: any;
    }
) {
    const supabase = await createClient();

    // Fetch current contract
    const { data: current, error: fetchError } = await supabase
        .from('presentation_contracts')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !current) {
        return { success: false, error: fetchError?.message || 'Contract not found' };
    }

    const nextAgentSig = updates.agent_signature !== undefined ? updates.agent_signature : current.agent_signature;
    const nextClientSig = updates.client_signature !== undefined ? updates.client_signature : current.client_signature;
    const nextClientDetails = updates.client_details !== undefined ? updates.client_details : current.client_details;
    
    const isSigned = !!(nextAgentSig && nextClientSig);
    
    const { data, error } = await supabase
        .from('presentation_contracts')
        .update({
            agent_signature: nextAgentSig,
            client_signature: nextClientSig,
            client_details: nextClientDetails,
            status: isSigned ? 'signed' : 'sent',
            signed_at: isSigned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating presentation signatures:', error);
        return { success: false, error: error.message };
    }

    // Sync client details back to the lead and profile records if updated
    if (updates.client_details) {
        const { leadId, idDocumentType, idSeriesNumber, cnp, email } = updates.client_details;
        const { createAdminClient } = await import('@/app/lib/supabase/admin');
        const adminSupabase = createAdminClient();
        
        // 1. Sync to Lead
        if (leadId) {
            await adminSupabase
                .from('leads')
                .update({
                    id_document_type: idDocumentType,
                    id_series_number: idSeriesNumber,
                    cnp: cnp
                })
                .eq('id', leadId);
        }

        // 2. Sync to Profile (if client has registered account)
        if (email) {
            await adminSupabase
                .from('profiles')
                .update({
                    cnp: cnp,
                    id_series_number: idSeriesNumber
                })
                .eq('email', email);
        }
    }

    // Log activity if signed
    if (isSigned && current.status !== 'signed') {
        try {
            await supabase.from('lead_activities').insert({
                lead_id: current.lead_id,
                type: 'contract_signed',
                description: `Fisa de Vizionare nr. ${current.contract_serial}/${current.contract_number} a fost semnata de catre client.`,
                created_by: current.agent_id
            });
        } catch (e) {
            console.error(e);
        }
    }

    revalidatePath('/dashboard/agent/presentation-contracts');
    return { success: true, contract: data };
}

/**
 * Locks a presentation contract.
 */
export async function lockPresentationContract(id: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('presentation_contracts')
        .update({ is_locked: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, contract: data };
}

/**
 * Deletes a presentation contract.
 * - Regular agents: If locked, requests deletion. Otherwise, deletes directly.
 * - Agency Managers & Admins: Deletes directly without restrictions.
 */
export async function deletePresentationContract(id: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Fetch user role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan_tier')
        .eq('id', user.id)
        .single();

    if (!profile) {
        return { success: false, error: 'Profile not found' };
    }

    const isAdmin = ['admin', 'super_admin'].includes(profile.role);
    const isAgencyManager = profile.role === 'agent' && profile.plan_tier === 'enterprise';

    // Fetch contract to check lock status
    const { data: contract, error: fetchError } = await supabase
        .from('presentation_contracts')
        .select('is_locked, agent_id')
        .eq('id', id)
        .single();

    if (fetchError || !contract) {
        return { success: false, error: fetchError?.message || 'Contract not found' };
    }

    const isOwner = contract.agent_id === user.id;

    // Check permissions
    let isAuthorized = isAdmin;
    if (!isAuthorized && isAgencyManager) {
        // Check if owner of contract is a team member
        const { data: isMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('agency_id', user.id)
            .eq('user_id', contract.agent_id)
            .maybeSingle();
        
        if (isMember || isOwner) {
            isAuthorized = true;
        }
    } else if (isOwner) {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        return { success: false, error: 'Access denied' };
    }

    if (contract.is_locked && !isAdmin && !isAgencyManager) {
        // Mark as delete requested
        const { error: updateError } = await supabase
            .from('presentation_contracts')
            .update({ delete_requested: true, updated_at: new Date().toISOString() })
            .eq('id', id);
            
        if (updateError) {
            return { success: false, error: updateError.message };
        }
        return { success: true, deleted: false, deleteRequested: true };
    } else {
        // Direct delete (for admins, managers, or unlocked contracts)
        const { error: deleteError } = await supabase
            .from('presentation_contracts')
            .delete()
            .eq('id', id);
            
        if (deleteError) {
            return { success: false, error: deleteError.message };
        }
        
        revalidatePath('/dashboard/agent/presentation-contracts');
        revalidatePath('/dashboard/admin/presentation-contracts');
        
        return { success: true, deleted: true, deleteRequested: false };
    }
}

/**
 * Fetches all presentation contracts associated with a specific property ID.
 */
export async function getPresentationContractsForProperty(propertyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

    let query = supabase
        .from('presentation_contracts')
        .select('*')
        .eq('property_id', propertyId);

    // If not admin, only show contracts generated by this agent
    if (!isAdmin) {
        query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, contracts: data || [] };
}

/**
 * Verifies if a Lead ID exists, and checks if the current user has ownership/access to it.
 * If the user has access, returns the full lead details.
 * If the user does not have access but the lead exists, returns { exists: true, hasAccess: false }.
 * If it does not exist, returns { exists: false }.
 */
export async function verifyLeadForContract(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(leadId)) {
        return { success: false, exists: false, error: 'Format ID invalid' };
    }

    try {
        // 1. Try to fetch lead using the user's standard client (respects RLS)
        const { data: lead } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .maybeSingle();

        if (lead) {
            // User owns/has access to this lead
            return { success: true, exists: true, hasAccess: true, lead };
        }

        // 2. If standard query returned nothing, check if the lead exists using the admin client (bypasses RLS)
        const { createAdminClient } = await import('@/app/lib/supabase/admin');
        const adminSupabase = createAdminClient();
        
        const { data: adminLead } = await adminSupabase
            .from('leads')
            .select('id')
            .eq('id', leadId)
            .maybeSingle();

        if (adminLead) {
            // Lead exists in database, but user doesn't own/have access to it
            return { success: true, exists: true, hasAccess: false };
        }

        return { success: true, exists: false };
    } catch (err: any) {
        console.error("Error verifying lead for contract:", err);
        return { success: false, error: err.message };
    }
}

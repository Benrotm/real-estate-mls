'use server';

import { createClient } from '@/app/lib/supabase/server';

interface CollaborationContractInput {
    agentProfile: any;
    formData: any;
    contractSerial: string;
    contractNumber: string;
    dateStr: string;
    timeStr: string;
    lang: 'ro' | 'en';
    propertyId?: string;
}

/**
 * Creates a new collaboration contract record in the database.
 */
export async function createCollaborationContract(input: CollaborationContractInput) {
    const supabase = await createClient();
    
    // Get optional current user (broker) ID
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
        .from('collaboration_contracts')
        .insert({
            agent_id: user?.id || null,
            property_id: input.propertyId || null,
            contract_number: input.contractNumber,
            contract_serial: input.contractSerial,
            status: 'sent',
            language: input.lang,
            agent_details: input.agentProfile,
            form_data: input.formData
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating collaboration contract:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contractId: data.id };
}

/**
 * Fetches a collaboration contract by UUID.
 */
export async function getCollaborationContract(id: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('collaboration_contracts')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching collaboration contract:', error);
        return { success: false, error: error.message };
    }

    // Fetch personal_property_id if property_id is set
    let personal_property_id = null;
    if (data.property_id) {
        const { data: propData } = await supabase
            .from('properties')
            .select('personal_property_id')
            .eq('id', data.property_id)
            .maybeSingle();
        if (propData) {
            personal_property_id = propData.personal_property_id;
        }
    }

    return { 
        success: true, 
        contract: {
            ...data,
            personal_property_id
        }
    };
}

/**
 * Fetches the latest collaboration contract for a specific property ID.
 */
export async function getCollaborationContractForProperty(propertyId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('collaboration_contracts')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching contract for property:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contract: data };
}

/**
 * Fetches all collaboration contracts associated with the logged-in agent.
 */
export async function getCollaborationContractsForAgent() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('collaboration_contracts')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agent collaboration contracts:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contracts: data || [] };
}

/**
 * Updates signatures on a collaboration contract.
 */
export async function updateCollaborationSignatures(
    id: string,
    updates: { agent_signature?: string; owner_signature?: string }
) {
    const supabase = await createClient();

    // Fetch current contract to see if both signatures will be present after this update
    const { data: current, error: fetchError } = await supabase
        .from('collaboration_contracts')
        .select('agent_signature, owner_signature, status')
        .eq('id', id)
        .single();

    if (fetchError || !current) {
        return { success: false, error: fetchError?.message || 'Contract not found' };
    }

    const nextAgentSig = updates.agent_signature !== undefined ? updates.agent_signature : current.agent_signature;
    const nextOwnerSig = updates.owner_signature !== undefined ? updates.owner_signature : current.owner_signature;
    
    const isSigned = !!(nextAgentSig && nextOwnerSig);
    
    const { data, error } = await supabase
        .from('collaboration_contracts')
        .update({
            agent_signature: nextAgentSig,
            owner_signature: nextOwnerSig,
            status: isSigned ? 'signed' : 'sent',
            signed_at: isSigned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating collaboration signatures:', error);
        return { success: false, error: error.message };
    }

    return { success: true, contract: data };
}

/**
 * Saves or updates Anexa 1 calculator data for a collaboration contract.
 */
export async function saveAnexa1ToContract(contractId: string, calculatorData: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('collaboration_contracts')
        .update({
            anexa_data: calculatorData,
            anexa_agent_signature: null,
            anexa_owner_signature: null,
            anexa_status: 'sent',
            anexa_signed_at: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', contractId)
        .select()
        .single();

    if (error) {
        console.error('Error saving Anexa 1:', error);
        return { success: false, error: error.message };
    }
    return { success: true, contract: data };
}

/**
 * Updates signatures on Anexa 1.
 */
export async function updateAnexaSignatures(
    id: string,
    updates: { agent_signature?: string; owner_signature?: string }
) {
    const supabase = await createClient();

    const { data: current, error: fetchError } = await supabase
        .from('collaboration_contracts')
        .select('anexa_agent_signature, anexa_owner_signature, anexa_status')
        .eq('id', id)
        .single();

    if (fetchError || !current) {
        return { success: false, error: fetchError?.message || 'Contract not found' };
    }

    const nextAgentSig = updates.agent_signature !== undefined ? updates.agent_signature : current.anexa_agent_signature;
    const nextOwnerSig = updates.owner_signature !== undefined ? updates.owner_signature : current.anexa_owner_signature;
    const isSigned = !!(nextAgentSig && nextOwnerSig);

    const { data, error } = await supabase
        .from('collaboration_contracts')
        .update({
            anexa_agent_signature: nextAgentSig,
            anexa_owner_signature: nextOwnerSig,
            anexa_status: isSigned ? 'signed' : 'sent',
            anexa_signed_at: isSigned ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating Anexa 1 signatures:', error);
        return { success: false, error: error.message };
    }
    return { success: true, contract: data };
}


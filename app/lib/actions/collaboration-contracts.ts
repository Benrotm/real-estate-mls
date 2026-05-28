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

    return { success: true, contract: data };
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

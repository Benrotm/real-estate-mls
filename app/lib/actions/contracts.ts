'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createNotification } from '@/app/lib/actions/notifications';
import { revalidatePath } from 'next/cache';

/**
 * Creates a new property proposal contract (Fisă de vizionare) for a lead.
 */
export async function createProposalContract(
    leadId: string,
    propertyIdOrRef: string,
    language: 'ro' | 'en'
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Fetch lead data
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        return { success: false, error: `Lead not found: ${leadError?.message}` };
    }

    // Fetch agent profile
    const { data: agent, error: agentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (agentError || !agent) {
        return { success: false, error: `Agent profile not found: ${agentError?.message}` };
    }

    // Fetch property by ID or friendly_id (e.g. P1971, 1971, etc.)
    const cleanRef = propertyIdOrRef.trim();
    const cleanRefNoP = cleanRef.toLowerCase().startsWith('p') ? cleanRef.substring(1) : cleanRef;

    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .or(`id.eq."${cleanRef}",friendly_id.eq."${cleanRef}",friendly_id.eq."P${cleanRef}",friendly_id.eq."P${cleanRefNoP}",friendly_id.eq."${cleanRefNoP}"`)
        .limit(1)
        .maybeSingle();

    if (propError || !property) {
        return { success: false, error: `Property not found (searched for "${propertyIdOrRef}").` };
    }

    // Match client profile by email to prefill from their profile page
    let client_id = null;
    let matchedClientProfile: any = null;
    if (lead.email) {
        const { data: clientProfile } = await supabase
            .from('profiles')
            .select('id, full_name, phone, cnp, id_series_number, email')
            .eq('email', lead.email.trim())
            .maybeSingle();
        if (clientProfile) {
            client_id = clientProfile.id;
            matchedClientProfile = clientProfile;
        }
    }

    // Generate unique contract number (format: YYYYMMDD-HHMMSS)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    const contract_number = `${year}${month}${day}-${hour}${minute}${second}`;
    const contract_serial = 'PROP';

    // Prepare JSON structures - completed automatically from profile page if matched, fallback to lead details
    const client_details = {
        fullName: matchedClientProfile?.full_name || lead.name || '',
        email: matchedClientProfile?.email || lead.email || '',
        phone: matchedClientProfile?.phone || lead.phone || '',
        cnp: matchedClientProfile?.cnp || lead.cnp || '',
        idSeriesNumber: matchedClientProfile?.id_series_number || lead.id_series_number || '',
        signed: false
    };

    const agent_details = {
        fullName: agent.full_name || '',
        email: agent.email || '',
        phone: agent.phone || '',
        companyName: agent.company_name || '',
        companyCui: agent.company_cui || '',
        companyRegCom: agent.company_reg_com || '',
        companyAddress: agent.company_address || ''
    };

    const property_details = {
        id: property.id,
        friendlyId: property.friendly_id,
        title: property.title,
        address: property.address,
        areaUsable: property.area_usable,
        rooms: property.rooms,
        price: property.price,
        currency: property.currency,
        contractCountry: property.contract_country,
        contractCity: property.contract_city,
        contractStreet: property.contract_street,
        contractBuilding: property.contract_building,
        contractFloor: property.contract_floor,
        contractApartment: property.contract_apartment,
        contractCfTopo: property.contract_cf_topo
    };

    // Insert contract record
    const { data: contract, error: insertError } = await supabase
        .from('proposal_contracts')
        .insert({
            lead_id: leadId,
            property_id: property.id,
            agent_id: user.id,
            client_id,
            contract_number,
            contract_serial,
            status: 'sent',
            language,
            client_details,
            agent_details,
            property_details
        })
        .select()
        .single();

    if (insertError || !contract) {
        console.error('Error inserting proposal contract:', insertError);
        return { success: false, error: `Failed to create contract: ${insertError?.message || 'Unknown error'}` };
    }

    // Create system notification for client if client has account
    if (client_id) {
        await createNotification({
            user_id: client_id,
            type: 'system',
            title: language === 'ro'
                ? 'Fișă de vizionare nouă'
                : 'New property viewing contract',
            content: language === 'ro'
                ? `Agentul ${agent.full_name} v-a trimis o fișă de vizionare pentru proprietatea: ${property.title}.`
                : `Agent ${agent.full_name} sent you a property proposal contract for property: ${property.title}.`,
            link: '/dashboard/client/contracts'
        });
    }

    // Log notes & activity on lead
    const logText = language === 'ro'
        ? `Trimis Fișă de Vizionare (seria ${contract_serial} nr. ${contract_number}) pentru proprietatea ${property.title} (ID: ${property.friendly_id || property.id}).`
        : `Sent Property Proposal Contract (serial ${contract_serial} no. ${contract_number}) for property ${property.title} (ID: ${property.friendly_id || property.id}).`;

    await supabase.from('lead_notes').insert({
        lead_id: leadId,
        created_by: user.id,
        content: logText
    });

    await supabase.from('lead_activities').insert({
        lead_id: leadId,
        type: 'contract_sent',
        description: logText,
        created_by: user.id
    });

    revalidatePath(`/dashboard/agent/leads/${leadId}`);
    return { success: true, contract };
}

/**
 * Signs a property proposal contract by client.
 */
export async function signProposalContract(
    contractId: string,
    clientInfo: { fullName: string; phone: string; cnp: string; idSeriesNumber: string }
) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    // Fetch the contract
    const { data: contract, error: contractError } = await supabase
        .from('proposal_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

    if (contractError || !contract) {
        return { success: false, error: `Contract not found: ${contractError?.message || 'Unknown error'}` };
    }

    // Update client details inside JSON
    const updatedClientDetails = {
        ...contract.client_details,
        fullName: clientInfo.fullName,
        phone: clientInfo.phone,
        cnp: clientInfo.cnp,
        idSeriesNumber: clientInfo.idSeriesNumber,
        signed: true
    };

    // Update contract status and signed_at
    const { error: updateError } = await supabase
        .from('proposal_contracts')
        .update({
            status: 'signed',
            signed_at: new Date().toISOString(),
            client_details: updatedClientDetails,
            client_id: user.id
        })
        .eq('id', contractId);

    if (updateError) {
        console.error('Error signing proposal contract:', updateError);
        return { success: false, error: `Failed to sign contract: ${updateError.message}` };
    }

    // Update user profile fields if they are missing
    const { data: profile } = await supabase
        .from('profiles')
        .select('cnp, id_series_number, phone, full_name')
        .eq('id', user.id)
        .single();

    if (profile) {
        const profileUpdates: any = {};
        if (!profile.cnp && clientInfo.cnp) profileUpdates.cnp = clientInfo.cnp;
        if (!profile.id_series_number && clientInfo.idSeriesNumber) profileUpdates.id_series_number = clientInfo.idSeriesNumber;
        if (!profile.phone && clientInfo.phone) profileUpdates.phone = clientInfo.phone;
        if (!profile.full_name && clientInfo.fullName) profileUpdates.full_name = clientInfo.fullName;

        if (Object.keys(profileUpdates).length > 0) {
            await supabase
                .from('profiles')
                .update(profileUpdates)
                .eq('id', user.id);
        }
    }

    // Create system notification for agent
    await createNotification({
        user_id: contract.agent_id,
        type: 'system',
        title: contract.language === 'ro'
            ? 'Fișă de vizionare semnată'
            : 'Viewing contract signed',
        content: contract.language === 'ro'
            ? `Clientul ${clientInfo.fullName} a semnat fișa de vizionare seria ${contract.contract_serial} nr. ${contract.contract_number}.`
            : `Client ${clientInfo.fullName} signed property viewing contract serial ${contract.contract_serial} no. ${contract.contract_number}.`,
        link: `/dashboard/agent/leads/${contract.lead_id}`
    });

    // Log notes & activity on lead
    const logText = contract.language === 'ro'
        ? `Fișa de Vizionare (seria ${contract.contract_serial} nr. ${contract.contract_number}) a fost SEMNATĂ de clientul ${clientInfo.fullName}.`
        : `Property Proposal Contract (serial ${contract.contract_serial} no. ${contract.contract_number}) was SIGNED by client ${clientInfo.fullName}.`;

    await supabase.from('lead_notes').insert({
        lead_id: contract.lead_id,
        created_by: user.id,
        content: logText
    });

    await supabase.from('lead_activities').insert({
        lead_id: contract.lead_id,
        type: 'contract_signed',
        description: logText,
        created_by: user.id
    });

    revalidatePath('/dashboard/client/contracts');
    revalidatePath(`/dashboard/agent/leads/${contract.lead_id}`);
    return { success: true };
}

/**
 * Fetches all proposal contracts associated with a lead (agent view).
 */
export async function getLeadContracts(leadId: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from('proposal_contracts')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching lead contracts:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetches all proposal contracts for the current client.
 */
export async function getProposalContractsForClient() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return [];
    }

    const { data, error } = await supabase
        .from('proposal_contracts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching client proposal contracts:', error);
        return [];
    }

    return data || [];
}

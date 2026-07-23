import React from 'react';
import { getOrCreateClientSelfServiceLead } from '@/app/lib/actions/leads';
import { getLeadMatches } from '@/app/lib/actions/matches';
import { createAdminClient } from '@/app/lib/supabase/admin';
import ClientAIMatchingClient from './ClientAIMatchingClient';

export const dynamic = 'force-dynamic';

export default async function ClientAIMatchingPage() {
    const leadRes = await getOrCreateClientSelfServiceLead();

    if ('error' in leadRes && leadRes.error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl m-6 border border-red-200">
                <h3 className="font-bold text-lg">Eroare la accesarea modulului AI Matching</h3>
                <p className="text-sm mt-1">{leadRes.error}</p>
            </div>
        );
    }

    const lead = leadRes.lead;
    const matchesRes = await getLeadMatches(lead.id);

    // Fetch recommendation config from admin_settings
    const adminSupabase = createAdminClient();
    const { data: recSetting } = await adminSupabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'ai_pipeline_recommendation')
        .single();

    const defaultRecText = `Intra de mai multe ori pe zi si da refresh la AI Matching pentru a vedea ce apare nou si a avea prima sansa sa fie al tau! Ce trebuie sa sti despre piata Imobiliara: La Chirii - 1) Proprietarii solicita plata chiriei in avans cand te muti in chirie si de obicei inca o luna de garantie, dar sunt si proprietari care solicita mai multe 2 sau 3 luni de garantie la apartamente de Lux sau Vile si Spatii comerciale. 2) Proprietarii vor inchiria in maxim 2 saptamani de la momentul cand scot proprietatea pe piata, deoarece sunt cereri multe si nu vor sa astepte 1 luna pana vine un client ca asta ar insemna sa piarda o luna de chirie. 3) Chiriile se iau pe un an si daca anunti cu 30 de zile inainte sa vrei sa pleci iti primesti garantia inapoi, dar exista si proprietari care nu returneaza chiria daca pleci mai repede de un an -aici iti recomandam sa vorbesti cu un Agent/Broker imobiliar de la Real Estate Hub deoarece te poate ajuta-.`;

    let recommendationConfig = { text: defaultRecText, points: 50 };
    if (recSetting?.value) {
        try {
            const parsed = typeof recSetting.value === 'string' ? JSON.parse(recSetting.value) : recSetting.value;
            recommendationConfig = {
                text: parsed.text || defaultRecText,
                points: parsed.points !== undefined ? Number(parsed.points) : 50
            };
        } catch (e) {
            recommendationConfig = { text: defaultRecText, points: 50 };
        }
    }

    // Fetch instant AI activation cost from feature_costs
    const { data: costsSetting } = await adminSupabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (costsSetting?.setting_value as Record<string, number>) || {};
    const instantAiCost = costsMap['instant_ai_activation_cost'] !== undefined ? Number(costsMap['instant_ai_activation_cost']) : 5;

    // Fetch user profile for approval check & credits
    const { data: userProfile } = await adminSupabase
        .from('profiles')
        .select('credits, is_approved, find_self_from_owner, wants_agent_help')
        .eq('id', lead.agent_id || lead.created_by)
        .single();

    return (
        <ClientAIMatchingClient
            lead={{
                ...lead,
                is_approved: userProfile?.is_approved !== false,
                find_self_from_owner: userProfile?.find_self_from_owner !== false,
                wants_agent_help: userProfile?.wants_agent_help !== false
            }}
            initialMatches={matchesRes.matches || []}
            recommendation={recommendationConfig}
            instantAiCost={instantAiCost}
            userCredits={userProfile?.credits || 0}
        />
    );
}

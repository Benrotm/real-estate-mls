'use server';

import { createClient } from '@/app/lib/supabase/server';
import { LeadData } from './leads';
import { revalidatePath } from 'next/cache';

export interface ScoringRule {
    id: string;
    category: string;
    criteria_key: string;
    label: string;
    weight: number;
    is_active: boolean;
}

export async function fetchScoringRules() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('scoring_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('label', { ascending: true });

    if (error) {
        console.error('Error fetching scoring rules:', error);
        return [];
    }
    return data as ScoringRule[];
}

export async function updateScoringRule(id: string, weight: number) {
    const supabase = await createClient();
    // In a real app, verify admin role here

    const { error } = await supabase
        .from('scoring_rules')
        .update({ weight })
        .eq('id', id);

    if (error) throw new Error('Failed to update rule');
    revalidatePath('/dashboard/admin/scoring');
}

export async function calculateLeadScore(lead: LeadData): Promise<number> {
    const rules = await fetchScoringRules();
    let score = 0;

    // Helper to find rule weight
    const getWeight = (key: string) => {
        const rule = rules.find(r => r.criteria_key === key && r.is_active);
        return rule ? rule.weight : 0;
    };

    // --- Financial ---
    if (lead.payment_method === 'Cash') score += getWeight('payment_method_cash');
    if (lead.payment_method === 'Credit') score += getWeight('payment_method_credit');

    if (lead.bank_status === 'Pre-approved') score += getWeight('bank_status_pre_approved');
    if (lead.budget_vs_market === 'Realistic') score += getWeight('budget_vs_market_realistic');

    // --- Urgency ---
    // Mapping frontend values to keys (simple includes check or exact match)
    if (lead.move_urgency?.includes('Urgent') || lead.move_urgency?.includes('< 1')) {
        score += getWeight('move_urgency_urgent');
    } else if (lead.move_urgency?.includes('Moderate') || lead.move_urgency?.includes('1-3')) {
        score += getWeight('move_urgency_moderate');
    }

    // --- Classification ---
    if (lead.agent_interest_rating === 'High') score += getWeight('agent_interest_high');
    if (lead.agent_interest_rating === 'Moderate') score += getWeight('agent_interest_moderate');

    return score;
}

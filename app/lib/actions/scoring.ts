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

    // --- Classification ---
    // Search Duration
    if (lead.search_duration === '< 1 month') score += getWeight('search_duration_under_1m');
    else if (lead.search_duration === '1-3 months') score += getWeight('search_duration_1_3m');
    else if (lead.search_duration === '3-6 months') score += getWeight('search_duration_3_6m');
    else if (lead.search_duration === '> 6 months') score += getWeight('search_duration_over_6m');

    // Variants Viewed (Total)
    if (lead.viewed_count_total === '0') score += getWeight('viewed_total_0');
    else if (lead.viewed_count_total === '1-2 variants') score += getWeight('viewed_total_1_2');
    else if (lead.viewed_count_total === '3-5 variants') score += getWeight('viewed_total_3_5');
    else if (lead.viewed_count_total === '> 5 variants') score += getWeight('viewed_total_over_5');

    // Move Urgency
    if (lead.move_urgency?.includes('Urgent')) score += getWeight('urgency_urgent');
    else if (lead.move_urgency?.includes('Moderate')) score += getWeight('urgency_moderate');
    else if (lead.move_urgency?.includes('Low')) score += getWeight('urgency_low');

    // Agent Interest
    if (lead.agent_interest_rating === 'High') score += getWeight('agent_interest_high');
    else if (lead.agent_interest_rating === 'Moderate') score += getWeight('agent_interest_moderate');
    else if (lead.agent_interest_rating === 'Low') score += getWeight('agent_interest_low');

    // --- Financial ---
    // Payment Method
    if (lead.payment_method === 'Cash') score += getWeight('payment_method_cash');
    if (lead.payment_method === 'Credit') score += getWeight('payment_method_credit');

    // Bank Status
    if (lead.bank_status === 'No') score += getWeight('bank_status_no');
    else if (lead.bank_status === 'In Progress') score += getWeight('bank_status_in_progress');
    else if (lead.bank_status === 'Pre-approved') score += getWeight('bank_status_pre_approved');
    else if (lead.bank_status === 'Not Needed') score += getWeight('bank_status_not_needed');

    // Budget vs Market
    if (lead.budget_vs_market === 'Realistic') score += getWeight('budget_market_realistic');
    else if (lead.budget_vs_market === 'Low') score += getWeight('budget_market_low');
    else if (lead.budget_vs_market === 'High') score += getWeight('budget_market_high');
    else if (lead.budget_vs_market === 'Unsure') score += getWeight('budget_market_unsure');

    // --- Viewing Activity ---
    const viewedAgent = Number(lead.viewed_count_agent) || 0;
    if (viewedAgent > 0) score += getWeight('viewed_agent_active');
    if (viewedAgent > 3) score += getWeight('viewed_agent_high_activity');

    // Recency
    if (lead.last_viewing_date) {
        const lastView = new Date(lead.last_viewing_date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastView.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) score += getWeight('viewing_recent_7days');
        else if (diffDays <= 30) score += getWeight('viewing_recent_30days');
    }

    // Outcome Status
    if (lead.outcome_status === 'A facut oferta') score += getWeight('outcome_offer_made');
    else if (lead.outcome_status === 'Se gandeste') score += getWeight('outcome_thinking');
    else if (lead.outcome_status === 'Asteapta Credit' || lead.outcome_status === 'Waiting for Credit') score += getWeight('outcome_waiting_credit');
    else if (lead.outcome_status === 'Mai cauta') score += getWeight('outcome_still_searching');
    else if (lead.outcome_status === 'Nu e interesat') score += getWeight('outcome_not_interested');

    return score;
}

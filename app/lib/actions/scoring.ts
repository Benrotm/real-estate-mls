'use server';

import { createClient } from '@/app/lib/supabase/server';
import { LeadData } from './leads';
import { Property } from '@/app/lib/properties';
import { revalidatePath } from 'next/cache';

export interface ScoringRule {
    id: string;
    category: string;
    criteria_key: string;
    label: string;
    weight: number;
    is_active: boolean;
    scope: 'lead' | 'property';
}

export async function fetchScoringRules(scope?: 'lead' | 'property') {
    const supabase = await createClient();
    let query = supabase
        .from('scoring_rules')
        .select('*')
        .order('category', { ascending: true })
        .order('label', { ascending: true });

    if (scope) {
        query = query.eq('scope', scope);
    }

    const { data, error } = await query;

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
    const rules = await fetchScoringRules('lead');
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

export async function calculatePropertyScore(property: Partial<Property>): Promise<number> {
    const rules = await fetchScoringRules('property');
    let score = 0;
    const getWeight = (key: string) => rules.find(r => r.criteria_key === key && r.is_active)?.weight || 0;

    // Type
    if (property.type === 'Apartment') score += getWeight('type_apartment');
    if (property.type === 'House') score += getWeight('type_house');
    if (property.type === 'Commercial') score += getWeight('type_commercial');

    // Condition / Age
    if (property.year_built && property.year_built > 2020) score += getWeight('condition_new');
    if (property.interior_condition === 'Renovated') score += getWeight('condition_renovated');
    if (property.interior_condition === 'Good') score += getWeight('condition_good');
    if (property.interior_condition === 'Needs Renovation') score += getWeight('condition_needs_renovation');

    // Features
    const feats = property.features || [];
    if (feats.includes('Parking') || feats.includes('Garage')) score += getWeight('feature_parking');
    if (feats.includes('Elevator')) score += getWeight('feature_elevator');
    if (feats.includes('Balcony') || feats.includes('Terrace')) score += getWeight('feature_balcony');
    if (feats.includes('Central Heating')) score += getWeight('feature_central_heating');

    // Media
    if (property.youtube_video_url || property.video_url) score += getWeight('media_video');
    if (property.virtual_tour_url) score += getWeight('media_virtual_tour');
    if (property.images && property.images.length > 5) score += getWeight('media_images_5plus');

    // Location (Simple keyword match for demo)
    // We could make this smarter with fuzzy matching or area mapping
    const locationStr = `${property.location_city} ${property.address || ''}`.toLowerCase();
    if (locationStr.includes('center') || locationStr.includes('old town') || locationStr.includes('central')) {
        score += getWeight('location_city_center');
    }

    // Floor
    if (property.floor === 0) score += getWeight('floor_ground');
    else if (property.floor === property.total_floors && property.total_floors && property.total_floors > 2) score += getWeight('floor_top');
    else if (property.floor && property.total_floors && property.floor > 0 && property.floor < property.total_floors) score += getWeight('floor_intermediate');

    return score;
}

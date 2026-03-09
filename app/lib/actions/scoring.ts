'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { LeadData } from '@/app/lib/types';
import { Property } from '@/app/lib/properties';
import { revalidatePath } from 'next/cache';

export interface ScoringRule {
    id: string;
    category: string;
    criteria_key: string;
    label: string;
    weight: number;
    is_active: boolean;
    scope: 'lead' | 'property' | 'match';
}

export async function fetchScoringRules(scope?: 'lead' | 'property' | 'match') {
    const supabase = createAdminClient();
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
    return (data || []) as ScoringRule[];
}

export async function updateScoringRule(id: string, weight: number, is_active?: boolean) {
    const supabase = await createClient();
    // In a real app, verify admin role here

    const updateData: any = { weight };
    if (is_active !== undefined) {
        updateData.is_active = is_active;
    }

    const { error } = await supabase
        .from('scoring_rules')
        .update(updateData)
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

    // Transaction Type
    if (property.listing_type === 'For Sale') score += getWeight('transaction_sale');
    if (property.listing_type === 'For Rent') score += getWeight('transaction_rent');
    if (property.listing_type === 'Hotel Regime') score += getWeight('transaction_hotel');

    // Property Type
    if (property.type === 'Apartment') score += getWeight('type_apartment');
    if (property.type === 'House') score += getWeight('type_house');
    if (property.type === 'Commercial') score += getWeight('type_commercial');
    if (property.type === 'Industrial') score += getWeight('type_industrial');
    if (property.type === 'Land') score += getWeight('type_land');
    if (property.type === 'Investment') score += getWeight('type_investment');
    if (property.type === 'Business') score += getWeight('type_business');
    if (property.type === 'Other') score += getWeight('type_other');

    // Condition / Age
    if (property.year_built && property.year_built > 2020) score += getWeight('condition_new');
    if (property.interior_condition === 'Newly Built') score += getWeight('condition_new');
    if (property.interior_condition === 'Renovated') score += getWeight('condition_renovated');
    if (property.interior_condition === 'Good') score += getWeight('condition_good');
    if (property.interior_condition === 'Fair') score += getWeight('cond_fair');
    if (property.interior_condition === 'Needs Renovation') score += getWeight('condition_needs_renovation');

    // Partitioning
    if (property.partitioning === 'Decomandat') score += getWeight('part_decomandat');
    if (property.partitioning === 'Semidecomandat') score += getWeight('part_semidecomandat');
    if (property.partitioning === 'Nedecomandat') score += getWeight('part_nedecomandat');
    if (property.partitioning === 'Circular') score += getWeight('part_circular');
    if (property.partitioning === 'Vagon') score += getWeight('part_vagon');

    // Comfort
    if (property.comfort === 'Lux') score += getWeight('comfort_lux');
    if (property.comfort === '1') score += getWeight('comfort_1');
    if (property.comfort === '2') score += getWeight('comfort_2');
    if (property.comfort === '3') score += getWeight('comfort_3');

    // Building Type
    if (property.building_type === 'Apartment Block') score += getWeight('build_apt_block');
    if (property.building_type === 'Individual House') score += getWeight('build_house');
    if (property.building_type === 'Duplex') score += getWeight('build_duplex');
    if (property.building_type === 'Villa') score += getWeight('build_villa');
    if (property.building_type === 'Office Building') score += getWeight('build_office');
    if (property.building_type === 'Mixed Use') score += getWeight('build_mixed');

    // Furnishing
    if (property.furnishing === 'Unfurnished') score += getWeight('furn_unfurnished');
    if (property.furnishing === 'Semi-furnished') score += getWeight('furn_semi');
    if (property.furnishing === 'Furnished') score += getWeight('furn_furnished');
    if (property.furnishing === 'Luxury Furnished') score += getWeight('furn_luxury');

    // Features array
    const feats = property.features || [];

    // Original Features
    if (feats.includes('Parking') || feats.includes('Garage')) score += getWeight('feature_parking');
    if (feats.includes('Elevator')) score += getWeight('feature_elevator');
    if (feats.includes('Balcony') || feats.includes('Terrace')) score += getWeight('feature_balcony');
    if (feats.includes('Central Heating')) score += getWeight('feature_central_heating');

    // Unit Features
    if (feats.includes('Air Conditioning')) score += getWeight('feat_air_cond');
    if (feats.includes('Fireplace')) score += getWeight('feat_fireplace');
    if (feats.includes('Jacuzzi')) score += getWeight('feat_jacuzzi');
    if (feats.includes('Laundry')) score += getWeight('feat_laundry');
    if (feats.includes('Private Pool')) score += getWeight('feat_pool_priv');
    if (feats.includes('Sauna')) score += getWeight('feat_sauna');
    if (feats.includes('Storage')) score += getWeight('feat_storage');
    if (feats.includes('Smart Home')) score += getWeight('sust_smart');
    if (feats.includes('Solar Panels')) score += getWeight('sust_solar');

    // Community Features
    if (feats.includes('Amphitheatre')) score += getWeight('comm_amphi');
    if (feats.includes('Clubhouse')) score += getWeight('comm_club');
    if (feats.includes('Common Garden')) score += getWeight('comm_garden');
    if (feats.includes('Jogging Track')) score += getWeight('comm_jog');
    if (feats.includes('Library')) score += getWeight('comm_lib');
    if (feats.includes('Park')) score += getWeight('comm_park');
    if (feats.includes('Party Hall')) score += getWeight('comm_party');
    if (feats.includes('Playground')) score += getWeight('comm_play');

    // Sports Features
    if (feats.includes('Basketball Court')) score += getWeight('sport_basket');
    if (feats.includes('Football Field')) score += getWeight('sport_foot');
    if (feats.includes('Gym')) score += getWeight('sport_gym');
    if (feats.includes('Squash Court')) score += getWeight('sport_squash');
    if (feats.includes('Swimming Pool')) score += getWeight('sport_swim');
    if (feats.includes('Tennis Court')) score += getWeight('sport_tennis');
    if (feats.includes('Yoga Deck')) score += getWeight('sport_yoga');

    // Security Features
    if (feats.includes('24/7 Security')) score += getWeight('sec_24_7');
    if (feats.includes('CCTV Surveillance')) score += getWeight('sec_cctv');
    if (feats.includes('Fire Safety')) score += getWeight('sec_fire');
    if (feats.includes('Gated Community')) score += getWeight('sec_gated');
    if (feats.includes('Intercom')) score += getWeight('sec_intercom');
    if (feats.includes('Video Door Phone')) score += getWeight('sec_video_door');

    // Sustainability Features
    if (feats.includes('Concierge')) score += getWeight('sust_concierge');
    if (feats.includes('Green Building')) score += getWeight('sust_green');
    if (feats.includes('Maintenance Staff')) score += getWeight('sust_aint');
    if (feats.includes('Power Backup')) score += getWeight('sust_power');
    if (feats.includes('Rainwater Harvesting')) score += getWeight('sust_rain');
    if (feats.includes('Sewage Treatment')) score += getWeight('sust_sewage');
    if (feats.includes('Visitor Parking')) score += getWeight('sust_visitor');

    // Listing Tags (stored in features array)
    if (feats.includes('Commission 0%')) score += getWeight('tag_commission_0');
    if (feats.includes('Exclusive')) score += getWeight('tag_exclusive');
    if (feats.includes('Foreclosure')) score += getWeight('tag_foreclosure');
    if (feats.includes('Hotel Regime')) score += getWeight('tag_hotel_regime');
    if (feats.includes('Luxury')) score += getWeight('tag_luxury');

    // Media
    if (property.youtube_video_url || property.video_url) score += getWeight('media_video');
    if (property.virtual_tour_url) score += getWeight('media_virtual_tour');
    if (property.images && property.images.length > 5) score += getWeight('media_images_5plus');

    // Location (Simple keyword match)
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

export async function calculateMatchScore(lead: LeadData, property: Property, rules: ScoringRule[]): Promise<number> {
    let score = 0;
    const getWeight = (key: string) => {
        const rule = rules.find(r => r.criteria_key === key);
        return (rule && rule.is_active) ? rule.weight : 0;
    };

    // 1. Transaction Type Match (CRITICAL - Hard requirement)
    if (lead.preference_listing_type !== property.listing_type) {
        return 0; // Absolute mismatch if one is Sale and other is Rent
    }
    score += getWeight('match_listing_type');

    // 2. Property Type Match
    if (lead.preference_type === property.type) {
        score += getWeight('match_type');
    }

    // 3. City Match
    if (lead.preference_location_city?.toLowerCase() === property.location_city?.toLowerCase()) {
        score += getWeight('match_city');
    }

    // 4. Area Match
    if (lead.preference_location_area && property.location_area &&
        lead.preference_location_area.toLowerCase() === property.location_area.toLowerCase()) {
        score += getWeight('match_area');
    }

    // 5. Budget Check
    if (lead.budget_max) {
        if (property.price <= lead.budget_max) {
            score += getWeight('match_budget');
        } else if (property.price <= lead.budget_max * 1.1) {
            // Within 10% margin
            score += Math.round(getWeight('match_budget') * 0.5);
        }
    }

    // 6. Rooms Check
    if (lead.preference_rooms_min && property.rooms) {
        if (property.rooms >= lead.preference_rooms_min) {
            score += getWeight('match_rooms');
        }
    }

    // 7. Surface Check
    if (lead.preference_surface_min && property.area_usable) {
        if (property.area_usable >= lead.preference_surface_min) {
            score += getWeight('match_surface');
        }
    }

    // 8. Floor Check
    if (property.floor !== undefined) {
        let matchesFloor = true;
        if (lead.preference_floor_min !== undefined && property.floor < lead.preference_floor_min) matchesFloor = false;
        if (lead.preference_floor_max !== undefined && property.floor > lead.preference_floor_max) matchesFloor = false;

        if (matchesFloor && (lead.preference_floor_min !== undefined || lead.preference_floor_max !== undefined)) {
            score += getWeight('match_floor');
        }
    }

    // 9. Year Built Check
    if (lead.preference_year_built_min && property.year_built) {
        if (property.year_built >= lead.preference_year_built_min) {
            score += getWeight('match_year_built');
        }
    }

    // 10. Bathrooms Check
    if (lead.preference_baths_min && property.bathrooms) {
        if (property.bathrooms >= lead.preference_baths_min) {
            score += getWeight('match_baths');
        }
    }

    // 11. Comfort / Interior / Furnishing Matching
    if (lead.preference_comfort && property.comfort === lead.preference_comfort) {
        score += getWeight('match_comfort');
    }
    if (lead.preference_furnishing && property.furnishing === lead.preference_furnishing) {
        score += getWeight('match_furnishing');
    }
    if (lead.preference_partitioning && property.partitioning === lead.preference_partitioning) {
        score += getWeight('match_partitioning');
    }
    if (lead.preference_building_type && property.building_type === lead.preference_building_type) {
        score += getWeight('match_building_type');
    }
    if (lead.preference_interior_condition && property.interior_condition === lead.preference_interior_condition) {
        score += getWeight('match_interior_condition');
    }

    // 12. Features Matching
    if (lead.preference_features && lead.preference_features.length > 0 && property.features) {
        const matchingFeatures = lead.preference_features.filter(f => property.features.includes(f));
        score += matchingFeatures.length * getWeight('match_features');
    }

    return score;
}

export async function findMatchingProperties(leadId: string) {
    const supabase = await createClient();

    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) return [];

    // 2. Fetch Active Properties (filtered by basic transaction/type for performance if needed)
    // For now we fetch all active properties and score them
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*, owner:profiles!properties_owner_id_fkey(id, full_name, email, phone, avatar_url)')
        .eq('status', 'active');

    if (propError || !properties) return [];

    // 3. Fetch Match Rules
    const rules = await fetchScoringRules('match');

    // 4. Calculate scores and sort
    const matches = await Promise.all(properties.map(async (p) => {
        const score = await calculateMatchScore(lead as LeadData, p as Property, rules);
        return { ...p, match_score: score };
    }));

    // Return properties with significant score (> 0) sorted by score
    return matches
        .filter(m => m.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score);
}

export async function findMatchingLeads(propertyId: string) {
    const supabase = await createClient();

    // 1. Fetch Property
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

    if (propError || !property) return [];

    // 2. Fetch All Leads with Agent info
    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('*, agent:profiles!leads_agent_id_fkey(full_name, email, phone, avatar_url)')
        .order('created_at', { ascending: false });

    if (leadError || !leads) return [];

    // 3. Fetch Match Rules
    const rules = await fetchScoringRules('match');

    // 4. Calculate scores and sort
    const matches = await Promise.all(leads.map(async (l) => {
        const score = await calculateMatchScore(l as LeadData, property as Property, rules);
        return { ...l, match_score: score };
    }));

    // Return leads with significant score (> 0) sorted by score
    return matches
        .filter(m => m.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score);
}

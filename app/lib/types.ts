
export interface LeadData {
    id?: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    source?: string;
    notes?: string;

    preference_type?: string;
    preference_listing_type?: string;
    preference_location_county?: string;
    preference_location_city?: string;
    preference_location_area?: string;

    budget_min?: number;
    budget_max?: number;
    currency?: string;

    preference_rooms_min?: number;
    preference_rooms_max?: number;
    preference_bedrooms_min?: number;
    preference_surface_min?: number;
    preference_surface_max?: number;

    preference_baths_min?: number;
    preference_year_built_min?: number;
    preference_floor_min?: number;
    preference_floor_max?: number;

    preference_partitioning?: string;
    preference_comfort?: string;
    preference_building_type?: string;
    preference_interior_condition?: string;
    preference_furnishing?: string;

    preference_features?: string[];

    // detailed criteria
    search_duration?: string;
    viewed_count_total?: string;
    move_urgency?: string;
    payment_method?: string;
    cash_amount?: number;
    bank_status?: string;
    budget_vs_market?: string;
    agent_interest_rating?: string;
    viewed_count_agent?: number;
    last_viewing_date?: string;
    outcome_status?: string;
    next_steps_summary?: string;
    score?: number;

    // Relations (optional for form, present in fetch)
    creator?: { full_name: string };
    created_at?: string;
    updated_at?: string;
    agent_id?: string;
    created_by?: string;
}

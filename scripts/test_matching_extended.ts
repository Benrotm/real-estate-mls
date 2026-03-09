
import { LeadData } from '../app/lib/types';
import { Property } from '../app/lib/properties';
import { ScoringRule, calculateMatchScore } from '../app/lib/actions/scoring';

async function testMatching() {
    console.log('--- Testing Extended Matching Logic ---');

    const rules: ScoringRule[] = [
        { id: '1', category: 'Match - Core', criteria_key: 'match_listing_type', label: 'Transaction Type Match', weight: 30, is_active: true, scope: 'match' },
        { id: '2', category: 'Match - Core', criteria_key: 'match_type', label: 'Property Type Match', weight: 30, is_active: true, scope: 'match' },
        { id: '3', category: 'Match - Core', criteria_key: 'match_city', label: 'City Match', weight: 20, is_active: true, scope: 'match' },
        { id: '4', category: 'Match - Location', criteria_key: 'match_area', label: 'Neighborhood (Area) Match', weight: 15, is_active: true, scope: 'match' },
        { id: '5', category: 'Match - Build', criteria_key: 'match_floor', label: 'Preferred Floor Range Match', weight: 10, is_active: true, scope: 'match' },
        { id: '6', category: 'Match - Build', criteria_key: 'match_year_built', label: 'Preferred Min Year Built Match', weight: 10, is_active: true, scope: 'match' },
        { id: '7', category: 'Match - Build', criteria_key: 'match_building_type', label: 'Building Type Match', weight: 10, is_active: true, scope: 'match' },
        { id: '8', category: 'Match - Build', criteria_key: 'match_interior_condition', label: 'Interior Condition Match', weight: 10, is_active: true, scope: 'match' },
        { id: '9', category: 'Match - Specs', criteria_key: 'match_baths', label: 'Bathrooms Match', weight: 5, is_active: true, scope: 'match' },
        { id: '10', category: 'Match - Specs', criteria_key: 'match_budget', label: 'Budget Match', weight: 40, is_active: true, scope: 'match' },
    ];

    const lead: LeadData = {
        name: 'Test Lead',
        preference_listing_type: 'For Sale',
        preference_type: 'Apartment',
        preference_location_city: 'Timisoara',
        preference_location_area: 'Complex',
        budget_max: 100000,
        preference_floor_min: 2,
        preference_floor_max: 5,
        preference_year_built_min: 2010,
        preference_baths_min: 2,
        preference_building_type: 'Apartment Block',
        preference_interior_condition: 'Renovated',
        status: 'new'
    };

    const properties: Property[] = [
        {
            id: 'p1',
            title: 'Exact Match',
            listing_type: 'For Sale',
            type: 'Apartment',
            location_city: 'Timisoara',
            location_area: 'Complex',
            price: 95000,
            currency: 'EUR',
            floor: 3,
            year_built: 2022,
            bathrooms: 2,
            building_type: 'Apartment Block',
            interior_condition: 'Renovated',
            owner_id: 'o1',
            description: '',
            location_county: '',
            features: [],
            images: [],
            status: 'active',
            created_at: '',
            updated_at: ''
        },
        {
            id: 'p2',
            title: 'Partial Match (Wrong Area & Floor)',
            listing_type: 'For Sale',
            type: 'Apartment',
            location_city: 'Timisoara',
            location_area: 'Braytim',
            price: 90000,
            currency: 'EUR',
            floor: 1,
            year_built: 2005,
            bathrooms: 1,
            building_type: 'Apartment Block',
            interior_condition: 'Good',
            owner_id: 'o1',
            description: '',
            location_county: '',
            features: [],
            images: [],
            status: 'active',
            created_at: '',
            updated_at: ''
        },
        {
            id: 'p3',
            title: 'Hard Mismatch (For Rent)',
            listing_type: 'For Rent',
            type: 'Apartment',
            location_city: 'Timisoara',
            location_area: 'Complex',
            price: 500,
            currency: 'EUR',
            owner_id: 'o1',
            description: '',
            location_county: '',
            features: [],
            images: [],
            status: 'active',
            created_at: '',
            updated_at: ''
        }
    ];

    for (const property of properties) {
        const score = await calculateMatchScore(lead, property, rules);
        console.log(`Property: ${property.title} | Score: ${score}`);
    }

    // Test Deactivated Rules
    console.log('\n--- Testing Deactivated Rules (Disabling Area Match) ---');
    const disabledRules = rules.map(r => r.criteria_key === 'match_area' ? { ...r, is_active: false } : r);
    const scoreWithDisabled = await calculateMatchScore(lead, properties[0], disabledRules);
    console.log(`Property: Exact Match (Area Disabled) | Score: ${scoreWithDisabled}`);
}

testMatching().catch(console.error);

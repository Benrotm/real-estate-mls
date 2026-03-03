// test-scoring.ts
require('dotenv').config({ path: '.env.local' });
const { calculatePropertyScore } = require('./app/lib/actions/scoring.js'); // Wait, scoring.ts is TS. We can run it via ts-node or dynamically import in a node script.

async function run() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Test what rules fetch actually returns
    const { data } = await supabase.from('scoring_rules').select('*').eq('scope', 'property');
    console.log("RULES FETCH:", data.length);
    const weight = data.find(r => r.criteria_key === 'condition_new' && r.is_active)?.weight || 0;
    console.log("WEIGHT condition_new:", weight);

    // Mock property
    const prop = {
        type: 'Apartment',
        listing_type: 'For Rent',
        year_built: 2026,
        images: [1, 2, 3, 4, 5, 6]
    };

    let score = 0;
    const getWeight = (key) => data.find(r => r.criteria_key === key && r.is_active)?.weight || 0;

    if (prop.listing_type === 'For Sale') score += getWeight('transaction_sale');
    if (prop.listing_type === 'For Rent') score += getWeight('transaction_rent');
    if (prop.type === 'Apartment') score += getWeight('type_apartment');
    if (prop.year_built && prop.year_built > 2020) score += getWeight('condition_new');
    if (prop.images && prop.images.length > 5) score += getWeight('media_images_5plus');
    if (prop.floor === 0) score += getWeight('floor_ground');

    console.log("CALCULATED SCORE:", score);
}

run();

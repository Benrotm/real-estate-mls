
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Simplified version of calculatePropertyScore for script usage
async function calculateScore(property: any, rules: any[]) {
    let score = 0;
    const getWeight = (key: string) => rules.find(r => r.criteria_key === key && r.is_active)?.weight || 0;

    // Type
    if (property.type === 'Apartment') score += getWeight('type_apartment');
    if (property.type === 'House') score += getWeight('type_house');

    // Condition
    if (property.year_built && property.year_built > 2020) score += getWeight('condition_new');
    if (property.interior_condition === 'Renovated') score += getWeight('condition_renovated');

    // Features
    const feats = property.features || [];
    if (feats.includes('Parking')) score += getWeight('feature_parking');
    if (feats.includes('Elevator')) score += getWeight('feature_elevator');

    // Media
    if (property.images && property.images.length > 5) score += getWeight('media_images_5plus');

    // Fallback if score is still low/zero for testing
    if (score < 50) score += 50;

    return Math.min(100, score);
}

async function run() {
    console.log('Fetching rules...');
    const { data: rules } = await supabase.from('scoring_rules').select('*').eq('scope', 'property');

    console.log('Fetching properties...');
    const { data: properties } = await supabase.from('properties').select('*');

    if (!properties || !rules) {
        console.error('Missing data');
        return;
    }

    console.log(`Found ${properties.length} properties.`);

    for (const prop of properties) {
        const score = await calculateScore(prop, rules);
        console.log(`Updating ${prop.title} with score ${score}`);

        await supabase.from('properties').update({ score }).eq('id', prop.id);
    }

    console.log('Done!');
}

run();

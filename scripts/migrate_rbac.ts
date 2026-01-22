import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_FEATURES = [
    // Owner Plans
    { role: 'owner', plan_name: 'Free', feature_label: '1 Property Listing', is_included: true, sort_order: 1 },
    { role: 'owner', plan_name: 'Free', feature_label: 'Basic Photos (5 max)', is_included: true, sort_order: 2 },
    { role: 'owner', plan_name: 'Free', feature_label: 'Virtual Tours', is_included: false, sort_order: 3 },
    { role: 'owner', plan_name: 'Premium', feature_label: '20 Property Listings', is_included: true, sort_order: 1 },
    { role: 'owner', plan_name: 'Premium', feature_label: 'Unlimited Photos', is_included: true, sort_order: 2 },
    { role: 'owner', plan_name: 'Premium', feature_label: 'Virtual Tours', is_included: true, sort_order: 3 },

    // Agent Plans
    { role: 'agent', plan_name: 'Free', feature_label: '5 Property Listings', is_included: true, sort_order: 1 },
    { role: 'agent', plan_name: 'Free', feature_label: 'Basic Profile', is_included: true, sort_order: 2 },
    { role: 'agent', plan_name: 'Professional', feature_label: '500 Property Listings', is_included: true, sort_order: 1 },
    { role: 'agent', plan_name: 'Professional', feature_label: 'CRM Integration', is_included: true, sort_order: 2 },

    // Developer Plans
    { role: 'developer', plan_name: 'Starter', feature_label: '5 Listings', is_included: true, sort_order: 1 },
    { role: 'developer', plan_name: 'Growth', feature_label: '50 Listings', is_included: true, sort_order: 1 },
];

const INITIAL_PLANS = [
    // Owner
    { role: 'owner', name: 'Free', price: 0, description: 'Try out the platform', is_popular: false },
    { role: 'owner', name: 'Basic', price: 29, description: 'For individual owners', is_popular: false },
    { role: 'owner', name: 'Premium', price: 79, description: 'Professional owners', is_popular: true },
    // Agent
    { role: 'agent', name: 'Free', price: 0, description: 'New Agents', is_popular: false },
    { role: 'agent', name: 'Professional', price: 149, description: 'Growing agents', is_popular: true },
    { role: 'agent', name: 'Enterprise', price: 399, description: 'Large agencies', is_popular: false },
    // Developer
    { role: 'developer', name: 'Starter', price: 0, description: 'Perfect for small projects', is_popular: false },
    { role: 'developer', name: 'Growth', price: 199, description: 'Scale your construction projects', is_popular: true },
    { role: 'developer', name: 'Scale', price: 499, description: 'Full enterprise solution', is_popular: false },
    // Client
    { role: 'client', name: 'Free', price: 0, description: 'Browse listings', is_popular: false },
    { role: 'client', name: 'Premium', price: 19, description: 'Full access', is_popular: true },
];

async function migrateRBAC() {
    console.log('Seeding Plans...');
    for (const plan of INITIAL_PLANS) {
        const { error } = await supabase.from('plans').insert([plan]);
        if (error) console.error('Error inserting plan:', error.message);
    }

    console.log('Seeding Plan Features...');
    // ... (rest of code)

    // 1. Clear existing features (Optional safety check)
    // await supabase.from('plan_features').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insert Features
    for (const feat of INITIAL_FEATURES) {
        const { error } = await supabase.from('plan_features').insert([{
            role: feat.role,
            plan_name: feat.plan_name,
            feature_key: feat.feature_label.toLowerCase().replace(/\s+/g, '_'),
            feature_label: feat.feature_label,
            is_included: feat.is_included,
            sort_order: feat.sort_order
        }]);
        if (error) console.error('Error inserting feature:', error.message);
    }

    console.log('Seeding Mock Profiles...');
    // Note: Creating actual auth users requires admin API or manual sign-up. 
    // Here we can assume users exist or just log that this step needs manual verification in Supabase dashboard.
    console.log('Please ensure you have a user designated as super_admin in the properties table manually.');

    console.log('Migration Complete.');
}

migrateRBAC();

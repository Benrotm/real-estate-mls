
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We need to verify that we can fetch properties AND their owner details
// which was previously causing the "column profiles.email does not exist" error.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying full property flow...');

    try {
        // 1. Fetch properties with owner join
        // Using the same query structure as getProperties in actions
        const { data: properties, error } = await supabase
            .from('properties')
            .select(`
                *,
                owner:profiles(full_name)
            `)
            .eq('status', 'active')
            .limit(5);

        if (error) {
            console.error('❌ Error fetching properties:', error);
            process.exit(1);
        }

        if (!properties || properties.length === 0) {
            console.warn('⚠️ No active properties found. Cannot verify join.');
        } else {
            console.log(`✅ Successfully fetched ${properties.length} properties.`);
            const firstProp = properties[0];
            console.log('First Property Owner:', firstProp.owner);

            if (firstProp.owner && firstProp.owner.full_name) {
                console.log('✅ Owner join successful: Found full_name');
            } else {
                console.warn('⚠️ Owner join returned data, but full_name might be missing or null:', firstProp.owner);
            }
        }

        // 2. Verify Feature Filtering (Amenities)
        // Check for 'Wifi' or 'Central Heating' which we know exist in mock data
        const testFeature = 'Central Heating';
        const { data: filteredProps, error: filterError } = await supabase
            .from('properties')
            .select('*')
            .contains('features', [testFeature]);

        if (filterError) {
            console.error('❌ Error with feature filter:', filterError);
        } else {
            console.log(`✅ Filtered by '${testFeature}': Found ${filteredProps?.length} properties.`);
        }

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

verify();

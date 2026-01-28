
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFilters() {
    console.log('Verifying filtering logic...');

    // 1. Fetch properties with "Central Heating"
    console.log('\nTest 1: Filter by "Central Heating"');
    const { data: data1, error: error1 } = await supabase
        .from('properties')
        .select('*')
        .contains('features', ['Central Heating']);

    if (error1) {
        console.error('Error Test 1:', error1);
    } else {
        console.log(`Found ${data1.length} properties with Central Heating.`);
        data1.forEach(p => console.log(` - ${p.title} (Features: ${JSON.stringify(p.features)})`));
    }

    // 2. Fetch properties with "Pool" (or Infinity Pool which might be stored as just a string in array)
    // The feature list in properties.ts has 'Pool'.
    // The mock property '6' has 'Infinity Pool'.
    // The filter checks for containment.
    // If I filter for 'Pool', checking `contains('features', ['Pool'])` requires exact match in the JSON array.

    console.log('\nTest 2: Filter by "Pool"');
    const { data: data2, error: error2 } = await supabase
        .from('properties')
        .select('*')
        .contains('features', ['Pool']);

    if (error2) {
        console.error('Error Test 2:', error2);
    } else {
        console.log(`Found ${data2.length} properties with Pool.`);
        data2.forEach(p => console.log(` - ${p.title} (Features: ${JSON.stringify(p.features)})`));
    }

    // 3. Test non-existent feature
    console.log('\nTest 3: Filter by "NonExistentFeature"');
    const { data: data3 } = await supabase
        .from('properties')
        .select('*')
        .contains('features', ['NonExistentFeature']);

    console.log(`Found ${data3?.length} properties (Expected 0).`);

}

verifyFilters();

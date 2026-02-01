
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlanFeatures() {
    console.log('Checking plan_features for owner role...');
    const { data, error } = await supabase
        .from('plan_features')
        .select('*')
        .eq('role', 'owner');

    if (error) {
        console.error('Error fetching plan_features:', error);
        return;
    }

    console.log('Plan Features for Owner:', JSON.stringify(data, null, 2));
}

checkPlanFeatures();

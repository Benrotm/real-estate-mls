
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProfiles() {
    console.log('Attempting to fetch one profile...');
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching profiles:', error);
    } else {
        console.log('Successfully fetched profile:', data);
        if (data && data.length > 0) {
            console.log('Profile keys:', Object.keys(data[0]));
        } else {
            console.log('No profiles found, but query succeeded.');
        }
    }

    console.log('\nAttempting to run the getProperties query...');
    const { data: props, error: propError } = await supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `)
        .limit(1);

    if (propError) {
        console.error('Error fetching properties with join:', propError);
    } else {
        console.log('Successfully fetched property with owner:', props);
    }
}

inspectProfiles();

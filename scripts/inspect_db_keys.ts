
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('Inspecting property columns...');
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Keys present in property object:', Object.keys(data[0]));
        console.log('Sample property:', data[0]);
    } else {
        console.log('No properties found.');
    }
}

inspectColumns();

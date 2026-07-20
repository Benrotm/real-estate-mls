import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase
        .from('marketing_pages')
        .select('*')
        .eq('page_key', 'clients')
        .single();
    if (error) {
        console.error('Error fetching marketing page:', error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}
run();

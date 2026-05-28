import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Settings:");
        console.log(JSON.stringify(data, null, 2));
    }
}
check();

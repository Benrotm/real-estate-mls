import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .gte('created_at', oneHourAgo);
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Transactions in the last hour:");
        console.log(JSON.stringify(data, null, 2));
    }
}
check();

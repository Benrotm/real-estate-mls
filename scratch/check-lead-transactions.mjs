import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*');
        
    if (error) {
        console.error("Error:", error);
    } else {
        const leadTxns = data.filter(t => t.metadata && t.metadata.lead_id);
        console.log("Lead unlock transactions in DB:", JSON.stringify(leadTxns, null, 2));
        console.log("Total transactions in DB:", data.length);
    }
}
check();

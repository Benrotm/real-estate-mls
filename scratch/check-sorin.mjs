import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const userId = '3be7bc4b-d7d7-4b3d-b28f-e33b9737905a';
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
    console.log("Sorin Dumea profile:", profile);

    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Sorin Dumea Transactions:");
        console.log(JSON.stringify(data, null, 2));
    }
}
check();

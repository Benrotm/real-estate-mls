import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*');
        
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profiles:");
        console.log(JSON.stringify(data.map(p => ({
            id: p.id,
            full_name: p.full_name,
            role: p.role,
            plan_tier: p.plan_tier,
            credits: p.credits
        })), null, 2));
    }
}
check();

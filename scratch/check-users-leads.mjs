import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    try {
        console.log("=== PROFILES ===");
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, role');
        console.log(JSON.stringify(profiles, null, 2));

        console.log("\n=== LEADS ===");
        const { data: leads } = await supabase
            .from('leads')
            .select('id, name, agent_id, created_by');
        console.log(JSON.stringify(leads, null, 2));

    } catch (err) {
        console.error(err);
    }
}

test();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    try {
        console.log("Fetching a single property...");
        const { data: prop, error } = await supabase
            .from('properties')
            .select('*')
            .limit(1)
            .single();

        if (error) {
            console.error("Error fetching property:", error);
            return;
        }

        console.log("Property columns and values:");
        const keys = Object.keys(prop).sort();
        keys.forEach(k => {
            console.log(`- ${k}: ${prop[k]}`);
        });

    } catch (err) {
        console.error(err);
    }
}

test();

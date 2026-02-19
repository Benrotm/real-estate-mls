import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('scraper_configs').select('selectors').eq('domain', 'publi24.ro').single();
    if (error) {
        console.error("Error fetching config:", error);
        return;
    }

    if (!data || !data.selectors) {
        console.log("No configuration found for publi24.ro");
        return;
    }

    let selectors = { ...data.selectors };
    console.log("Old Selectors:", selectors);

    let updated = false;
    for (const key in selectors) {
        if (typeof selectors[key] === 'string' && selectors[key].includes('div:contains')) {
            selectors[key] = selectors[key].replace(/div:contains/g, '.attribute-item:contains');
            updated = true;
        }
    }

    if (updated) {
        const { error: updateError } = await supabase.from('scraper_configs').update({ selectors }).eq('domain', 'publi24.ro');
        if (updateError) {
            console.error("Error updating config:", updateError);
        } else {
            console.log("Successfully updated config:", selectors);
        }
    } else {
        console.log("No updates needed. Everything already uses correct selectors.");
    }
}

run();

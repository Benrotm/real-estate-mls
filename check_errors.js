require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkErrors() {
    const { data, error } = await supabase
        .from('scraped_urls')
        .select('url, status, error_message, updated_at')
        .eq('status', 'failed')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("DB Error:", error);
    } else {
        console.log("Latest Failed Imports:");
        console.log(data);
    }

    const { data: logs, error: lError } = await supabase
        .from('scrape_logs')
        .select('*')
        .eq('log_level', 'error')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log("\nLatest Scrape Logs (Errors):");
    console.log(logs);
}

checkErrors();

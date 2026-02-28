const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: logs, error: logsErr } = await supabase.from('scrape_logs').select('message, created_at, job_id').order('created_at', { ascending: false }).limit(20);
    if (logsErr) { console.error("Logs Error:", logsErr); }
    else {
        console.log("Recent Logs:");
        logs.reverse().forEach(l => console.log(`[${new Date(l.created_at).toLocaleTimeString()}] ${l.message}`));
    }
}

check();

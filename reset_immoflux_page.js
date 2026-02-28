const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function reset() {
    const { data: current, error: getErr } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    if (getErr || !current) { console.error("Error getting:", getErr); return; }

    let val = current.value;
    val.last_page_scraped = 0;

    const { data, error } = await supabase.from('admin_settings').update({ value: val }).eq('key', 'immoflux_integration');
    if (error) console.error("Error updating:", error);
    else console.log("Successfully reset last_page_scraped to 0!");
}

reset();

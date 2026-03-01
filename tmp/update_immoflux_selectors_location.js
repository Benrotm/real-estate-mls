const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim().replace(/^\"|\"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Fetching Immoflux config...');
    const { data: row } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    let config = row ? row.value : {};

    config.mapping = {
        ...config.mapping,
        // Using more general selectors (removing p. or td. prefix where not necessary)
        location_city: '.slidepanel-info a[href*=\"maps\"]',
        location_area: '.slidepanel-info strong'
    };

    console.log('Upserting resilient selectors...');
    const { error } = await supabase.from('admin_settings').upsert({
        key: 'immoflux_integration',
        value: config
    }, { onConflict: 'key' });

    if (error) console.error('Error:', error);
    else console.log('Successfully updated Immoflux location selectors!');
}
run();

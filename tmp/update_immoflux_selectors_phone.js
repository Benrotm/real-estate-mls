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

    // Remove old 'phone' key if it exists and replace with 'owner_phone'
    const oldMapping = config.mapping || {};
    delete oldMapping.phone;

    config.mapping = {
        ...oldMapping,
        title: 'div.col-sm-12 > h3',
        price: 'span.blue-600',
        description: 'h4:contains(\"Descriere\")',
        location_city: 'p.slidepanel-info a[href*=\"maps\"]',
        location_area: 'p.slidepanel-info strong',
        rooms: 'div.col-sm-6:contains(\"Camere\") strong',
        area: 'div.col-sm-6:contains(\"Suprafata utila\") strong',
        owner_phone: 'div.btn-icon:has(i.fa-phone)'
    };

    console.log('Upserting final selectors with owner_phone...');
    const { error } = await supabase.from('admin_settings').upsert({
        key: 'immoflux_integration',
        value: config
    }, { onConflict: 'key' });

    if (error) console.error('Error:', error);
    else console.log('Successfully updated Immoflux selectors!');
}
run();

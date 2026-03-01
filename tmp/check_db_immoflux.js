
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestImmoflux() {
    // Check for properties created in the last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .gt('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: false });

    console.log(`Found ${properties.length} properties matching 'Timisoara'.`);
    properties.forEach(p => {
        console.log('---');
        console.log('ID:', p.id);
        console.log('Title:', p.title);
        console.log('Address (DB):', p.address);
        console.log('City (DB):', p.location_city);
        console.log('Area (DB):', p.location_area);
        console.log('County (DB):', p.location_county);
        console.log('Source:', p.source_url);
        console.log('Created At:', p.created_at);
    });
}

checkLatestImmoflux();

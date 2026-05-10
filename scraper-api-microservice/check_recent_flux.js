const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

let supabaseUrl, supabaseKey;
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
    const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (urlMatch) supabaseUrl = urlMatch[1].trim();
    if (keyMatch) supabaseKey = keyMatch[1].trim();
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentFlux() {
    console.log('Fetching recent properties from 2025-03-19...');
    const { data, error } = await supabase
        .from('properties')
        .select('id, title, personal_property_id, created_at, description')
        .gte('created_at', '2025-03-19T00:00:00Z')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(p => {
        console.log(`ID: ${p.id} | Title: ${p.title} | PersonalID: ${p.personal_property_id} | Created: ${p.created_at}`);
    });
}

checkRecentFlux();

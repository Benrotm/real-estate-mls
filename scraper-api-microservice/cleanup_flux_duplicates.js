const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to find .env.local in common locations
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
        const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
        if (urlMatch) supabaseUrl = urlMatch[1].trim();
        if (keyMatch) supabaseKey = keyMatch[1].trim();
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Checked env and .env.local at', envPath);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupFluxDuplicates() {
    console.log('Searching for FluxMLS duplicates (19.03.2025 - 20.03.2025)...');
    console.log('Using URL:', supabaseUrl);
    
    // Get properties from FluxMLS created in the last 48 hours
    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, url, created_at')
        .filter('url', 'ilike', '%fluxmls.immoflux.ro%')
        .gte('created_at', '2025-03-19T00:00:00Z');

    if (error) {
        console.error('Error fetching properties:', error);
        return;
    }

    console.log(`Found ${properties.length} FluxMLS properties created recently.`);

    const urlMap = {};
    const toDelete = [];

    // Sort by created_at ascending so the first one we see is the oldest
    properties.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    for (const p of properties) {
        if (!p.url) continue;
        
        if (urlMap[p.url]) {
            // Already seen this URL, this is a duplicate
            toDelete.push(p.id);
        } else {
            urlMap[p.url] = p;
        }
    }

    console.log(`Identified ${toDelete.length} duplicate entries.`);
    
    for (const id of toDelete) {
        const p = properties.find(x => x.id === id);
        console.log(`Duplicate found: ID: ${id} | URL: ${p.url} | Created: ${p.created_at}`);
    }

    if (toDelete.length > 0) {
        console.log(`\nProceeding to delete ${toDelete.length} duplicates...`);
        
        const { error: delError } = await supabase
            .from('properties')
            .delete()
            .in('id', toDelete);
            
        if (delError) {
            console.error('Error deleting duplicates:', delError);
        } else {
            console.log('Successfully deleted duplicates.');
        }
    } else {
        console.log('\nNo duplicates found to delete.');
    }
}

cleanupFluxDuplicates();

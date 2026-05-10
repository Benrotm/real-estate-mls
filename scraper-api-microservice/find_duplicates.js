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

async function findDuplicateTitles() {
    console.log('Searching for duplicate titles created recently...');
    
    // Get all properties from the last 2 days
    const { data: recent, error } = await supabase
        .from('properties')
        .select('id, title, created_at')
        .gte('created_at', '2026-03-18T00:00:00Z');

    if (error) {
        console.error(error);
        return;
    }

    const titleMap = {};
    const duplicates = [];

    recent.forEach(p => {
        if (!p.title) return;
        if (titleMap[p.title]) {
            duplicates.push(p);
        } else {
            titleMap[p.title] = p;
        }
    });

    console.log(`Found ${duplicates.length} duplicate titles in the last 2 days.`);
    
    for (const d of duplicates) {
        const original = titleMap[d.title];
        console.log(`Duplicate found: "${d.title}"`);
        console.log(`  - Original: ID: ${original.id} | Created: ${original.created_at}`);
        console.log(`  - Duplicate: ID: ${d.id} | Created: ${d.created_at}`);
    }

    if (duplicates.length > 0) {
        console.log(`\nTo delete: ${duplicates.map(d => d.id).join(', ')}`);
        // await supabase.from('properties').delete().in('id', duplicates.map(d => d.id));
    }
}

findDuplicateTitles();

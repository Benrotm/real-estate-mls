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

async function identifySpecificDuplicates() {
    console.log('Identifying FluxMLS duplicates created on 19.03.2025 and 20.03.2025...');
    
    // 1. Fetch properties from today and yesterday
    const { data: recent, error: rError } = await supabase
        .from('properties')
        .select('id, title, created_at')
        .gte('created_at', '2026-03-19T00:00:00Z')
        .order('created_at', { ascending: true });

    if (rError) {
        console.error('Error fetching recent properties:', rError);
        return;
    }

    console.log(`Analyzing ${recent.length} recent properties...`);

    const toDelete = [];
    const processedTitles = new Set();

    for (const p of recent) {
        if (!p.title || p.title.length < 5) continue;

        // Check if this title exists ALREADY in the DB (older than 19.03)
        const { data: older, error: oError } = await supabase
            .from('properties')
            .select('id, created_at')
            .eq('title', p.title)
            .lt('created_at', '2026-03-19T00:00:00Z')
            .limit(1);

        if (oError) {
            console.error(`Error checking older for "${p.title}":`, oError);
            continue;
        }

        if (older && older.length > 0) {
            console.log(`[DUPLICATE OF OLD] Title: "${p.title}" | New ID: ${p.id} | Old ID: ${older[0].id}`);
            toDelete.push({ id: p.id, title: p.title, type: 'OLD_MATCH' });
            continue;
        }

        // Check if we've seen this title ALREADY in this current script run (older within today)
        if (processedTitles.has(p.title)) {
            console.log(`[DUPLICATE OF RECENT] Title: "${p.title}" | New ID: ${p.id}`);
            toDelete.push({ id: p.id, title: p.title, type: 'RECENT_MATCH' });
        } else {
            processedTitles.add(p.title);
        }
    }

    console.log(`\nTOTAL TO DELETE: ${toDelete.length}`);
    
    if (toDelete.length > 0) {
        fs.writeFileSync('to_delete_ids.json', JSON.stringify(toDelete, null, 2));
        console.log('Detailed list saved to to_delete_ids.json');
        
        // Output IDs for Easy Copy-Paste if needed
        console.log('IDs:');
        console.log(toDelete.map(d => d.id).join(', '));
    }
}

identifySpecificDuplicates();

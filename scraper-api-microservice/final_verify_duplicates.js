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

async function finalVerify() {
    const toDeleteInfo = JSON.parse(fs.readFileSync('to_delete_ids.json', 'utf8'));
    const ids = toDeleteInfo.map(d => d.id);
    
    console.log(`Verifying ${ids.length} potential duplicates...`);
    
    const { data: duplicates, error: dError } = await supabase
        .from('properties')
        .select('id, title, price, area_usable, created_at')
        .in('id', ids);

    if (dError) {
        console.error(dError);
        return;
    }

    const confirmedIDs = [];
    const skippedIDs = [];

    for (const d of duplicates) {
        let query = supabase
            .from('properties')
            .select('id, created_at')
            .eq('title', d.title)
            .neq('id', d.id)
            .lt('created_at', d.created_at);

        if (d.price === null || d.price === undefined) {
            query = query.is('price', null);
        } else {
            query = query.eq('price', d.price);
        }

        if (d.area_usable === null || d.area_usable === undefined) {
            query = query.is('area_usable', null);
        } else {
            query = query.eq('area_usable', d.area_usable);
        }

        const { data: matches, error: mError } = await query.limit(1);

        if (mError) {
            console.error(`Error for ${d.id}:`, mError);
            continue;
        }

        if (matches && matches.length > 0) {
            confirmedIDs.push(d.id);
        } else {
            console.log(`Skipping (No exact match found): "${d.title}" | ID: ${d.id} | Price: ${d.price} | Area: ${d.area_usable}`);
            skippedIDs.push(d.id);
        }
    }

    console.log(`\nFinal Confirmed for Deletion: ${confirmedIDs.length}`);
    console.log(`Skipped (Keep as unique): ${skippedIDs.length}`);
    
    fs.writeFileSync('confirmed_delete_ids.json', JSON.stringify(confirmedIDs));
    console.log('Confirmed IDs saved to confirmed_delete_ids.json');
}

finalVerify();

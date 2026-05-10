const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

let supabaseUrl, supabaseKey;
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
    supabaseKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runIntegrityCheck() {
    console.log('--- Property Scraper Integrity Check ---');
    console.log(`Checking properties created in the last 7 days...\n`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: properties, error } = await supabase
        .from('properties')
        .select('id, title, price, area_usable, created_at, status')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching properties:', error);
        return;
    }

    console.log(`Total properties analyzed: ${properties.length}`);

    // 1. Duplicate Detection (Title + Price + Area)
    const seen = new Map();
    const duplicates = [];

    properties.forEach(p => {
        const key = `${p.title}|${p.price}|${p.area_usable}`;
        if (seen.has(key)) {
            duplicates.push({ current: p, original: seen.get(key) });
        } else {
            seen.set(key, p);
        }
    });

    if (duplicates.length > 0) {
        console.log(`\n[WARNING] Found ${duplicates.length} potential duplicates!`);
        duplicates.slice(0, 10).forEach(d => {
            console.log(` - "${d.current.title}" (${d.current.created_at}) matches original from ${d.original.created_at}`);
        });
        if (duplicates.length > 10) console.log(` ... and ${duplicates.length - 10} more.`);
    } else {
        console.log('\n[SUCCESS] No duplicates found in the last 7 days.');
    }

    // 2. Health Check: Missing Fields
    const missingPrice = properties.filter(p => !p.price || p.price === 0).length;
    const missingArea = properties.filter(p => !p.area_usable).length;

    console.log(`\n[HEALTH] Properties with €0 price: ${missingPrice}`);
    console.log(`[HEALTH] Properties with missing area: ${missingArea}`);

    if (missingPrice > properties.length * 0.2) {
        console.log('[ALERT] High percentage of missing prices! Check scraper extraction logic.');
    }

    console.log('\n--- Integrity Check Complete ---');
}

runIntegrityCheck();

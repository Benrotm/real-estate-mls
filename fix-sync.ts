
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://cwfhcrftwsxsovexkero.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmhjcmZ0d3N4c292ZXhrZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDc5NDAsImV4cCI6MjA4NDI4Mzk0MH0.v1zvSTkuE_lyn6IqtN4Vs2oPFguWzPe6DWrXMfTbXe0'
);

async function fixSync() {
    console.log('Fetching Data...');
    const { data: plans } = await supabase.from('plans').select('*');
    const { data: allFeatures } = await supabase.from('plan_features').select('*');

    if (!plans || !allFeatures) {
        console.error('Failed to fetch data');
        return;
    }

    console.log(`Found ${plans.length} plans and ${allFeatures.length} feature entries.`);

    // 1. Identify Unique Global Features
    const uniqueDefs = new Map();
    allFeatures.forEach(f => {
        if (!uniqueDefs.has(f.feature_key)) {
            uniqueDefs.set(f.feature_key, {
                label: f.feature_label,
                sort: f.sort_order
            });
        }
    });

    console.log(`Unique Global Features found: ${uniqueDefs.size}`);
    uniqueDefs.forEach((v, k) => console.log(` - ${k} ("${v.label}")`));

    // 2. Iterate Plans and Sync
    for (const plan of plans) {
        console.log(`\nChecking Plan: ${plan.role} :: ${plan.name} (${plan.id})`);

        for (const [key, def] of uniqueDefs.entries()) {
            const existing = allFeatures.filter(f =>
                f.role === plan.role &&
                f.plan_name === plan.name &&
                f.feature_key === key
            );

            if (existing.length === 0) {
                console.log(`   [MISSING] Adding key '${key}'...`);
                const { error } = await supabase.from('plan_features').insert({
                    role: plan.role,
                    plan_name: plan.name,
                    feature_key: key,
                    feature_label: def.label,
                    is_included: false,
                    sort_order: def.sort
                });
                if (error) console.error(`   ERROR inserting: ${error.message}`);
            } else if (existing.length > 1) {
                console.log(`   [DUPLICATE] Found ${existing.length} entries for '${key}'. Keeping ID ${existing[0].id}, deleting others...`);
                const toRemove = existing.slice(1).map(x => x.id);
                const { error } = await supabase.from('plan_features').delete().in('id', toRemove);
                if (error) console.error(`   ERROR deleting: ${error.message}`);
            } else {
                // console.log(`   [OK] '${key}' exists.`);
            }
        }
    }
    console.log('\nSync Complete.');
}

fixSync();

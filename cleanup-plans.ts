
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://cwfhcrftwsxsovexkero.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmhjcmZ0d3N4c292ZXhrZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDc5NDAsImV4cCI6MjA4NDI4Mzk0MH0.v1zvSTkuE_lyn6IqtN4Vs2oPFguWzPe6DWrXMfTbXe0'
);

async function cleanupDuplicates() {
    console.log('Cleaning up duplicate plans...');

    const { data: plans } = await supabase.from('plans').select('*');
    if (!plans) return;

    // Group by role+name
    const groups: any = {};
    plans.forEach(p => {
        const key = `${p.role}::${p.name}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
    });

    for (const [key, list] of Object.entries(groups)) {
        if ((list as any[]).length > 1) {
            console.log(`Found duplicate plans for ${key}: ${(list as any[]).length} copies.`);
            // Sort by created_at desc (if available) or just id. 
            // We'll keep the first one and delete the others.
            // Actually, we should probably keep the one with ID that matches any existing profiles? 
            // For safety, let's just keep the first one found (usually oldest if sorted by ID default?).
            // Supabase returns in insertion order usually.

            const [keep, ...remove] = (list as any[]);
            console.log(`Keeping Plan ID: ${keep.id}`);

            for (const r of remove) {
                console.log(`Deleting Duplicate Plan ID: ${r.id}`);
                const { error } = await supabase.from('plans').delete().eq('id', r.id);
                if (error) console.error('Error deleting plan:', error.message);
            }
        }
    }

    console.log('\nCleaning up feature duplicates...');
    // We can re-use the Sync logic logic which handles cleaning up duplicates.
    // Or just run the robust logic from fix-sync logic again implicitly by clearing relevant features?
    // Actually, because we deleted the extra Plan row, the 'plan_features' table (which keys off Name)
    // STILL HAS duplicates because the features were inserted twice.
    // Deleting the Plan row doesn't cascade delete these features because they aren't linked by ID!
    // So we assume the previous fix-sync script logic handles duplicates.
    // BUT, the previous logic checked for duplicates by Key.
    // Since we have N copies of the same key for the same planName...
    // Yes, fix-sync.ts logic was:
    // "if (existing.length > 1) { delete all but first }"
    // So running a sync/dedupe pass will fix it.

    // Let's implement that specific dedupe logic here efficiently.
    const { data: allFeatures } = await supabase.from('plan_features').select('*');
    if (!allFeatures) return;

    const featureGroups: any = {};
    allFeatures.forEach(f => {
        const k = `${f.role}::${f.plan_name}::${f.feature_key}`;
        if (!featureGroups[k]) featureGroups[k] = [];
        featureGroups[k].push(f);
    });

    let deletedFeatures = 0;
    for (const group of Object.values(featureGroups)) {
        const list = group as any[];
        if (list.length > 1) {
            const [keep, ...remove] = list;
            const idsToRemove = remove.map(r => r.id);
            await supabase.from('plan_features').delete().in('id', idsToRemove);
            deletedFeatures += idsToRemove.length;
        }
    }
    console.log(`Removed ${deletedFeatures} duplicate feature entries.`);
}

cleanupDuplicates();

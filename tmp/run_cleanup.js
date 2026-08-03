const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envText = fs.readFileSync(envPath, 'utf8');
        envText.split('\n').forEach(line => {
            const [k, v] = line.split('=');
            if (k && v) {
                if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v.trim();
                if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = v.trim();
            }
        });
    }
}

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Cleaning immoflux links from documents array across all properties in Supabase...');

    let page = 0;
    const pageSize = 1000;
    let totalDocsCleaned = 0;

    while (true) {
        const start = page * pageSize;
        const end = start + pageSize - 1;

        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, documents')
            .range(start, end);

        if (error || !properties || properties.length === 0) {
            break;
        }

        for (const prop of properties) {
            const docs = Array.isArray(prop.documents) ? prop.documents : [];
            const hasImmoflux = docs.some(d => typeof d === 'string' && d.includes('immoflux.ro'));

            if (!hasImmoflux) continue;

            const cleanDocs = docs.filter(d => typeof d === 'string' && !d.includes('immoflux.ro'));

            const { error: updateErr } = await supabase
                .from('properties')
                .update({
                    documents: cleanDocs,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prop.id);

            if (!updateErr) {
                totalDocsCleaned++;
                console.log(`[DOCS CLEANED #${prop.id}] Removed immoflux link from documents.`);
            }
        }

        page++;
    }

    console.log(`Finished! Total properties updated to remove immoflux links: ${totalDocsCleaned}`);
}

main();

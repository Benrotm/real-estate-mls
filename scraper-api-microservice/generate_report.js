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

async function generateReport() {
    const ids = JSON.parse(fs.readFileSync('confirmed_delete_ids.json', 'utf8'));
    
    console.log(`Generating report for ${ids.length} confirmed duplicates...`);
    
    const { data: duplicates, error: dError } = await supabase
        .from('properties')
        .select('*')
        .in('id', ids);

    if (dError) {
        console.error(dError);
        return;
    }

    let reportMarkdown = '# Duplicate Properties Verification Report\n\n';
    reportMarkdown += 'The following 40 properties were found to be duplicates (identical Title, Price, and Area) of older entries. Please review them.\n\n';
    reportMarkdown += '| Duplicate ID | Title | Price | Area | Created At | Original Match |\n';
    reportMarkdown += '| --- | --- | --- | --- | --- | --- |\n';

    for (const d of duplicates) {
        let query = supabase
            .from('properties')
            .select('id, created_at')
            .eq('title', d.title)
            .neq('id', d.id)
            .lt('created_at', d.created_at);

        if (d.price === null || d.price === undefined) query = query.is('price', null);
        else query = query.eq('price', d.price);

        if (d.area_usable === null || d.area_usable === undefined) query = query.is('area_usable', null);
        else query = query.eq('area_usable', d.area_usable);

        const { data: matches } = await query.limit(1);
        const original = matches && matches.length > 0 ? matches[0] : { id: 'N/A', created_at: 'N/A' };

        reportMarkdown += `| [${d.id.substring(0,8)}...](file:///c:/Users/bensi/Downloads/Git%20hub%20Repository/real-estate-mls/properties/${d.id}) | ${d.title} | ${d.price} | ${d.area_usable} | ${d.created_at} | [${original.id.substring(0,8)}...](file:///c:/Users/bensi/Downloads/Git%20hub%20Repository/real-estate-mls/properties/${original.id}) (${original.created_at}) |\n`;
    }

    fs.writeFileSync('duplicate_report.md', reportMarkdown);
    console.log('Report generated at duplicate_report.md');
}

generateReport();

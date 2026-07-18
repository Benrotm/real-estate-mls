const fs = require('fs');

if (fs.existsSync('.env.local')) {
    const env = fs.readFileSync('.env.local', 'utf8');
    env.split('\n').forEach(line => {
        const m = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
        if (m) {
            process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    try {
        const targetNames = ['1 Decembrie', '23 August', '2 Mai', 'Abram', 'Abrud'];
        
        const { data, error } = await supabase
            .from('system_locations')
            .select('*')
            .in('name', targetNames);
            
        if (error) throw error;
        
        console.log(`Found ${data.length} records matching targets:`);
        data.forEach(item => {
            console.log(`ID: ${item.id}, Type: ${item.type}, Name: ${item.name}, Parent: ${item.parent_id}, Lat: ${item.latitude}, Lng: ${item.longitude}`);
        });

        // Also let's check what counties exist in the database
        const { data: counties } = await supabase
            .from('system_locations')
            .select('id, name')
            .eq('type', 'county');
            
        console.log('\nCounties in database:', counties.length);
        const countyMap = {};
        counties.forEach(c => countyMap[c.id] = c.name);
        
        console.log('\nResolved targets with County names:');
        data.forEach(item => {
            const countyName = item.parent_id ? (countyMap[item.parent_id] || 'Unknown ID: ' + item.parent_id) : 'NULL';
            console.log(`- ${item.name} (${item.type}) -> Parent: ${countyName} (ID: ${item.parent_id})`);
        });

    } catch (err) {
        console.error(err);
    }
}
test();

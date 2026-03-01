const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
    await supabase.from('properties').delete().eq('source', 'immoflux');
    console.log('Cleaned up badly scraped properties.');

    const { data } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    if (data) {
        let config = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        config.mapping = {
            title: 'div.col-sm-12 > h3',
            price: 'span.blue-600',
            description: '#descriere, .description, body',
            location_city: '.slidepanel-info',
            rooms: 'div.col-sm-6:contains("Camere") strong',
            phone: 'a[href^="tel:"]'
        };
        await supabase.from('admin_settings').update({ value: config }).eq('key', 'immoflux_integration');
        console.log('Updated Immoflux selectors!');
    } else {
        console.log('immoflux_integration setting not found.');
    }
}
run();

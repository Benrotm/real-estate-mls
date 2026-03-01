
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSelectors() {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'immoflux_integration')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Full data.value for Immoflux:');
    console.log(JSON.stringify(data.value, null, 2));
}

checkSelectors();

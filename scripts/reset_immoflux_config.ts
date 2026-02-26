import { createClient } from '@supabase/supabase-js';

// Load environment variables manually since we are running a script outside Next.js
// Actually, to make it simple we will just use the Supabase JS client and provide keys
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Clearing Immoflux Integration settings to force default values...');

    const { error } = await supabase
        .from('admin_settings')
        .delete()
        .eq('key', 'immoflux_integration');

    if (error) {
        console.error('Error resetting settings:', error);
        process.exit(1);
    }

    console.log('Successfully reset Immoflux Integration settings.');
    console.log('The new default configuration mapping will be loaded when you visit the Settings page.');

    process.exit(0);
}

run();

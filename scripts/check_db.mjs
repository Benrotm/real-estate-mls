
import { createClient } from '../app/lib/supabase/server.ts';

async function checkConfigs() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('scraper_configs')
            .select('*');

        if (error) {
            console.error('DB Error:', error);
            return;
        }

        console.log('Total configs:', data?.length);
        console.log('Configs:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Script error:', e);
    }
}

checkConfigs();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data, error } = await supabase.from('service_categories').select('*').order('sort_order', { ascending: true });
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Categories count:', data.length);
    console.log('Categories:', data.map(c => ({ id: c.id, title: c.title, slug: c.slug, sort_order: c.sort_order })));
}
check();

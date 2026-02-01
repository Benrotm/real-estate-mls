
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    const { data, error } = await supabase.from('properties').select('id, title, score').limit(10);
    if (error) console.error(error);
    else console.log(data);
}

check();


import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verifyFix() {
    console.log('Verifying profiles join...');
    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `)
        .limit(1);

    if (error) {
        console.error('❌ Verification Failed:', error.message);
        console.error('Details:', error);
    } else {
        console.log('✅ Verification Succeeded!');
        if (data && data.length > 0) {
            console.log('Sample data:', JSON.stringify(data[0].owner, null, 2));
        } else {
            console.log('No properties found, but query syntax is valid.');
        }
    }
}

verifyFix();


import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPrivateInfo() {
    console.log('Verifying Private Info Feature...');

    // 1. Check if column exists by trying to select it (mock insert/select)
    // We can't easily check schema without service role, but we can try to insert a property with private notes via valid user if we had one.
    // Since we don't have a valid user session here easily, we will try to fetch a known property and see if we can select 'private_notes'.
    // IF the column doesn't exist, Supabase will return an error on select 'private_notes'.

    console.log('Attempting to select private_notes column...');
    const { data, error } = await supabase
        .from('properties')
        .select('id, private_notes')
        .limit(1);

    if (error) {
        console.error('Error selecting private_notes:', error.message);
        if (error.message.includes('does not exist')) {
            console.error('FAIL: Column `private_notes` does NOT exist. Migration was likely not run.');
        }
    } else {
        console.log('SUCCESS: Column `private_notes` exists (or at least query didn\'t fail).');
        console.log('Data:', data);
    }

    // 2. Check documents column
    console.log('Attempting to select documents column...');
    const { data: docData, error: docError } = await supabase
        .from('properties')
        .select('id, documents')
        .limit(1);

    if (docError) {
        console.error('Error selecting documents:', docError.message);
    } else {
        console.log('SUCCESS: Column `documents` exists.');
    }

}

verifyPrivateInfo();

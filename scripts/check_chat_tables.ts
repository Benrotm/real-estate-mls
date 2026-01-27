
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('Checking for chat tables...');

    const { error: convError } = await supabase.from('conversations').select('id').limit(1);
    const { error: partError } = await supabase.from('conversation_participants').select('conversation_id').limit(1);
    const { error: msgError } = await supabase.from('messages').select('id').limit(1);

    if (convError && convError.code === '42P01') { // 42P01 is undefined_table
        console.log('❌ Table conversations DOES NOT exist');
    } else if (convError) {
        console.log('⚠️ Error checking conversations:', convError.message);
    } else {
        console.log('✅ Table conversations exists');
    }

    if (partError && partError.code === '42P01') {
        console.log('❌ Table conversation_participants DOES NOT exist');
    } else if (partError) {
        console.log('⚠️ Error checking conversation_participants:', partError.message);
    } else {
        console.log('✅ Table conversation_participants exists');
    }

    if (msgError && msgError.code === '42P01') {
        console.log('❌ Table messages DOES NOT exist');
    } else if (msgError) {
        console.log('⚠️ Error checking messages:', msgError.message);
    } else {
        console.log('✅ Table messages exists');
    }

    // Also check if messaging is real-time enabled? 
    // Hard to check via client without admin, but good enough for now.
}

checkTables();

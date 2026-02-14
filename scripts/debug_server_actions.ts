
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { calculateLeadScore } from '../app/lib/actions/scoring';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

// Mimic the service role client for testing (bypassing Auth for simplicity in script, 
// using generic user ID if needed or just inserting directly if RLS allows/Service role bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFetchLeads() {
    console.log('--- Testing fetchLeads query ---');
    // Mimic the query from leads.ts
    const { data, error } = await supabase
        .from('leads')
        .select('*, creator:created_by(full_name)')
        .limit(5);

    if (error) {
        console.error('Fetch Leads Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Fetch Leads Success. Count:', data.length);
        if (data.length > 0) {
            console.log('Sample Lead:', JSON.stringify(data[0], null, 2));
            console.log('created_at type:', typeof data[0].created_at);
            console.log('score type:', typeof data[0].score);
            console.log('preference_features type:', typeof data[0].preference_features);
            console.log('preference_features isArray:', Array.isArray(data[0].preference_features));
            console.log('Creator Relation:', data[0].creator);
        }
    }
}

async function checkColumns() {
    console.log('--- Checking Column Constraints ---');
    const { data, error } = await supabase
        .rpc('get_column_info', { table_name: 'leads' }); // This might not exist, use raw query if possible or metadata

    // Easier: Just try to insert a minimal lead and see what fails
    console.log('Skipping column constraint check in simplified script.');
}

async function main() {
    await testFetchLeads();
}

main();

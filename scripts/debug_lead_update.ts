
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { updateLead } from '../app/lib/actions/leads';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

// Mimic the service role client for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdateLead() {
    console.log('--- Testing updateLead ---');

    // 1. Fetch a real lead to get a valid ID
    const { data: leads } = await supabase.from('leads').select('id, name, created_by').limit(1);

    if (!leads || leads.length === 0) {
        console.error('No leads found to update.');
        return;
    }

    const lead = leads[0];
    console.log(`Testing update on Lead ID: ${lead.id} (${lead.name})`);

    // 2. Prepare update data (mimicking LeadForm payload)
    const updatePayload: any = {
        name: lead.name + ' (Updated)',
        phone: '111-2222',
        status: 'new',
        // Common fields that might cause issues
        budget_min: 100000,
        preference_features: ['Air Conditioning'],
        currency: 'EUR'
    };

    try {
        // We need to mock the auth context for the action to work, OR we can just call the Supabase update directly 
        // to see if it's the QUERY that fails, or the Action wrapper.
        // Since we can't easily mock `createServerClient` cookies in this script, 
        // let's try to replicate the `updateLead` logic manually first to check for SQL/Schema errors.

        console.log('Attempting direct Supabase update (simulating action logic)...');

        const cleanData = Object.fromEntries(
            Object.entries(updatePayload).filter(([k, v]) => k !== 'notes' && k !== 'id' && v !== undefined && v !== null && v !== '')
        );

        const { error } = await supabase
            .from('leads')
            .update({ ...cleanData })
            .eq('id', lead.id);

        if (error) {
            console.error('Supabase Update Failed:', JSON.stringify(error, null, 2));
        } else {
            console.log('Supabase Update Success!');
        }

    } catch (err: any) {
        console.error('Script Error:', err.message);
    }
}

main();

async function main() {
    await testUpdateLead();
}

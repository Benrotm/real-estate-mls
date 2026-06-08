import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    try {
        const leadId = '74d548bb-215d-49fe-a0cb-f2a71434f94d';
        console.log(`Fetching lead ${leadId} directly with service role...`);
        const { data: lead, error } = await supabase
            .from('leads')
            .select('*')
            .eq('id', leadId)
            .single();

        if (error) {
            console.error("Error fetching lead:", error);
            return;
        }

        console.log("Lead Details:");
        console.log(JSON.stringify(lead, null, 2));

        // Now let's test what verifyLeadForContract would return if we mimic its steps.
        // Wait, who is the user logged in in the screenshot?
        // Let's see the screenshot: The top right has "Team" and avatar.
        // Let's check who the team members are or what the current user is.
        // Let's query profiles or users to see.
        console.log("\nChecking who owns the lead or if there's any user association...");
        if (lead.user_id) {
            const { data: ownerProfile } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('id', lead.user_id)
                .single();
            console.log("Owner Profile:", ownerProfile);
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

test();

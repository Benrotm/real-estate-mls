import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        console.log("Checking target user profile...");
        // Let's find a user who has a profile
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .limit(5);

        if (userError) {
            console.error("Error fetching users:", userError);
            return;
        }

        console.log("Found users:", users);

        const targetUser = users[0];
        if (!targetUser) {
            console.log("No users found in database.");
            return;
        }

        const userId = targetUser.id;
        console.log(`Running referral stats query simulation for user ID: ${userId} (${targetUser.email})`);

        // Simulating the query
        const { data: invitees, error: inviteesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at')
            .eq('referred_by', userId);

        if (inviteesError) {
            console.error("inviteesError:", inviteesError);
            return;
        }

        console.log("Invitees count:", invitees?.length || 0);

        // Test the JSON filter query in credit_transactions
        const dummyInviteeId = '197e57d8-140e-4d58-9935-26ec50ce797c'; // a random uuid
        const { data: commissionData, error: commissionError } = await supabase
            .from('credit_transactions')
            .select('amount')
            .eq('user_id', userId)
            .eq('metadata->>invitee_id', dummyInviteeId)
            .ilike('description', 'Comision%');

        if (commissionError) {
            console.error("commissionError (metadata path query):", commissionError);
        } else {
            console.log("commission query succeeded! Results:", commissionData);
        }
    } catch (e: any) {
        console.error("Unhandled error:", e);
    }
}

main();

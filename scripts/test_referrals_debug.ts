import { getReferralStats } from '../app/lib/actions/referrals';
import { createClient } from '../app/lib/supabase/server';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testAction() {
    try {
        console.log("Calling getReferralStats...");
        const res = await getReferralStats();
        console.log("Result:", res);
    } catch (e: any) {
        console.error("Action failed with error:", e);
    }
}

testAction();

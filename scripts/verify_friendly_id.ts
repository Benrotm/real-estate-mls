
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFriendlyId() {
    console.log('Verifying friendly_id generation...');

    // 1. Create a minimal property
    // We need a valid owner_id usually. If we don't have one, we might fail RLS.
    // However, let's try to fetch a user first or just try inserting if RLS is lax.
    // If we fail, we'll know.

    // Attempt to match the schema requirements
    const testProperty = {
        title: 'Test Friendly ID Property',
        description: 'Temporary property to test ID generation',
        type: 'Apartment',
        listing_type: 'For Sale',
        price: 1000,
        currency: 'EUR',
        status: 'draft',
        // Minimal required fields?
    };

    const { data: inserted, error } = await supabase
        .from('properties')
        .insert(testProperty)
        .select()
        .single();

    if (error) {
        console.error('Insert Error:', error);

        // If error is RLS, we can't easily verify without a user token.
        // But if the error is "relation "properties" does not exist" or column missing, we know migration failed.
        if (error.message.includes('friendly_id')) {
            console.error('Column friendly_id likely missing!');
        }
        return;
    }

    console.log('Insert successful:', inserted);

    if (inserted.friendly_id) {
        console.log(`SUCCESS: friendly_id generated: ${inserted.friendly_id}`);
        // Cleanup
        await supabase.from('properties').delete().eq('id', inserted.id);
        console.log('Cleanup: Deleted test property.');
    } else {
        console.error('FAILURE: friendly_id was NOT generated (is null).');
    }
}

verifyFriendlyId();

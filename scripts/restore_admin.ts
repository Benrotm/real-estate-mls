
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use SERVICE ROLE KEY to bypass RLS and ensure we can update
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function restoreAdmin(email: string) {
    console.log(`Attempting to restore SuperAdmin for: ${email}`);

    // 1. Find the user
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email);

    if (findError) {
        console.error('Error searching for user:', findError);
        return;
    }

    if (!profiles || profiles.length === 0) {
        console.error(`User with email ${email} not found.`);
        return;
    }

    const user = profiles[0];
    console.log(`Found user: ${user.id} (Current Role: ${user.role})`);

    // 2. Update the role
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id)
        .select()
        .single();

    if (updateError) {
        console.error('Error updating role:', updateError);
    } else {
        console.log('✅ Successfully updated role to:', updated.role);
    }
}

const targetEmail = 'ben.smarthub@example.com';
restoreAdmin(targetEmail);

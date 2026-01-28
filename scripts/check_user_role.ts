
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkUserRole(email: string) {
    console.log(`Checking role for user: ${email}`);

    // We can't query auth.users directly with anon key usually, but we CAN query public.profiles
    // assuming the profile exists and RLS allows reading (or we use service role if available).
    // Wait, anon key RLS might block reading *other* profiles if not admin.
    // However, I previously successfully verified joins.
    // Let's try to find by email in profiles.

    // Note: The 'email' column was just added to profiles in migration 007.

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('email', email);

    if (error) {
        console.error('Error fetching profile:', error);
        return;
    }

    if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        console.log(`Found profile for ${email}:`);
        console.log(`- ID: ${profile.id}`);
        console.log(`- Role: ${profile.role}`);
        console.log(`- Full Name: ${profile.full_name}`);

        if (profile.role === 'super_admin') {
            console.log('✅ User IS a super_admin.');
        } else {
            console.log(`⚠️ User is NOT a super_admin. Current role: ${profile.role}`);
        }
    } else {
        console.log(`❌ No profile found with email: ${email}`);
        console.log('Note: This might be because the user hasn not logged in since the migration added email, or RLS prevents viewing.');
    }
}

const email = 'bensilion@gmail.com';
checkUserRole(email);

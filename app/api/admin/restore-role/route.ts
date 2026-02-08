import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

// This endpoint restores a specific user's role to super_admin
// It requires the SUPABASE_SERVICE_ROLE_KEY to be set in the environment
// IMPORTANT: Delete this route after use for security

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const secret = searchParams.get('secret');

    // Simple secret protection - change this before deploying
    if (secret !== 'restore_admin_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
        return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find the user
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('email', email);

    if (findError) {
        return NextResponse.json({ error: 'Error finding user', details: findError.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
        return NextResponse.json({ error: `User with email ${email} not found` }, { status: 404 });
    }

    const user = profiles[0];
    const previousRole = user.role;

    // Update the role
    const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', user.id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: 'Error updating role', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: `Role restored for ${user.full_name || email}`,
        previousRole,
        newRole: updated.role
    });
}

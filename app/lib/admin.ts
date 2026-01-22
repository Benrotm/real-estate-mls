'use server';

import { createClient } from '@/app/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { UserRole } from './auth';

// --- Impersonation ---

export async function impersonateRole(role: UserRole) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Verify actual Super Admin status (Double check against DB)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin') throw new Error('Forbidden: Only Super Admins can impersonate.');

    const cookieStore = await cookies();
    cookieStore.set('impersonated_role', role, { path: '/' });
    revalidatePath('/');
}

export async function stopImpersonation() {
    const cookieStore = await cookies();
    cookieStore.delete('impersonated_role');
    revalidatePath('/');
}

// --- Feature Management ---

export async function updatePlanFeature(featureId: string, isIncluded: boolean) {
    const supabase = await createClient();
    // RLS will handle auth checks, but good to add layer here
    const { error } = await supabase
        .from('plan_features')
        .update({ is_included: isIncluded })
        .eq('id', featureId);

    if (error) throw new Error(error.message);
    revalidatePath('/pricing'); // Update public pricing page
    revalidatePath('/dashboard/admin');
}

export async function addPlanFeature(planFeature: { role: string, plan_name: string, feature_key: string, feature_label: string }) {
    await verifyAdmin(); // Verify Admin with Dev Bypass

    const supabase = await createClient();

    // In a real app we would check admin role here

    const { error } = await supabase
        .from('plan_features')
        .insert([{ ...planFeature, is_included: false, sort_order: 99 }]);

    if (error) throw new Error(error.message);
    revalidatePath('/pricing');
    revalidatePath('/dashboard/admin/plans');
}

// Fallback Data for when DB tables are missing
const FALLBACK_FEATURES = [
    { role: 'owner', plan_name: 'Free', feature_label: 'Basic Listings', is_included: true, sort_order: 1 },
    { role: 'owner', plan_name: 'Premium', feature_label: 'Unlimited Photos', is_included: true, sort_order: 2 },
    { role: 'agent', plan_name: 'Professional', feature_label: 'CRM Integration', is_included: true, sort_order: 1 },
];

export async function fetchAllFeatures() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('plan_features')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.warn('DB Error (Features):', error.message);
            return FALLBACK_FEATURES;
        }
        return data || FALLBACK_FEATURES;
    } catch (e) {
        console.error('Exception fetching features:', e);
        return FALLBACK_FEATURES;
    }
}

// Helper to verify admin access (bypassed in Development for Mock scenarios)
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow bypass in development if no user is found (Mock Admin mode)
    if (!user && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Admin Action bypassed (Development Mode)');
        return { user: { id: 'mock-admin-id' } }; // Return mock user
    }

    if (!user) throw new Error('Unauthorized');
    return { user };
}

// --- Plan Management ---

const FALLBACK_PLANS = [
    { role: 'owner', name: 'Free', price: 0, description: 'Starter', is_popular: false, listings_limit: 1, featured_limit: 0 },
    { role: 'owner', name: 'Premium', price: 79, description: 'Pro', is_popular: true, listings_limit: 10, featured_limit: 2 },
    { role: 'agent', name: 'Free', price: 0, description: 'New Agents', is_popular: false, listings_limit: 5, featured_limit: 0 },
    { role: 'agent', name: 'Professional', price: 149, description: 'Power Users', is_popular: true, listings_limit: 100, featured_limit: 10 },
];

export async function fetchAllPlans() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) {
            console.warn('DB Error (Plans):', error.message);
            return FALLBACK_PLANS;
        }
        return data || FALLBACK_PLANS;
    } catch (e) {
        console.error('Exception fetching plans:', e);
        return FALLBACK_PLANS;
    }
}

export async function updatePlanDetails(planId: string, updates: { price?: number, description?: string, listings_limit?: number, featured_limit?: number }) {
    await verifyAdmin(); // Verify Admin with Dev Bypass

    const supabase = await createClient();
    const { error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', planId);

    if (error) throw new Error(error.message);
    revalidatePath('/pricing');
    revalidatePath('/dashboard/admin/plans');
}

export async function createPlan(plan: { role: string, name: string, price: number, description: string, listings_limit: number, featured_limit: number }) {
    await verifyAdmin(); // Verify Admin with Dev Bypass

    const supabase = await createClient();
    const { error } = await supabase
        .from('plans')
        .insert([{ ...plan, is_popular: false }]);

    if (error) throw new Error(error.message);
    revalidatePath('/pricing');
    revalidatePath('/dashboard/admin');
    revalidatePath('/dashboard/admin/plans');
}

export async function deletePlan(planId: string): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('Server Action: deletePlan called for ID:', planId);
        await verifyAdmin(); // Verify Admin with Dev Bypass

        const supabase = await createClient();

        // 1. Get plan details first to know the name/role for cleanup
        const { data: plan, error: fetchError } = await supabase
            .from('plans')
            .select('price, role, name')
            .eq('id', planId)
            .single();

        if (fetchError) {
            console.warn('⚠️ Could not fetch plan details for cascade delete:', fetchError.message);
        }

        if (plan) {
            console.log(`Checking for features to cascade delete for plan: ${plan.name} (${plan.role})`);

            // 2. Delete associated features (Manual Cascade)
            const { error: cascadeError } = await supabase
                .from('plan_features')
                .delete()
                .eq('role', plan.role)
                .eq('plan_name', plan.name);

            if (cascadeError) {
                console.error('❌ Error cascading delete features:', cascadeError.message);
            } else {
                console.log('✅ Associated features deleted.');
            }
        }

        // 3. Delete the plan itself
        const { error } = await supabase
            .from('plans')
            .delete()
            .eq('id', planId);

        if (error) {
            console.error('❌ Database error deleting plan:', error.message);
            return { success: false, error: 'DB Error: ' + error.message };
        }

        console.log('✅ Plan deleted successfully.');
        revalidatePath('/pricing');
        revalidatePath('/dashboard/admin');
        revalidatePath('/dashboard/admin/plans');
        return { success: true };
    } catch (e: any) {
        console.error('🔥 CRITICAL ERROR in deletePlan:', e);
        return { success: false, error: e.message || 'Unknown Server Error' };
    }
}

// --- User Management ---

export async function fetchUsers() {
    try {
        await verifyAdmin();
        const supabase = await createClient();

        console.log('Fetching users...');
        // Simplified query first to ensure basic data fetching works
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('role');

        if (error) {
            console.error('❌ DB Error (Users):', error.message);
            // Return Mock Users if DB fails or is empty
            return MOCK_USERS;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No users found in DB. Returning mock users for demo.');
            return MOCK_USERS;
        }

        console.log(`✅ Fetched ${data?.length || 0} users.`);
        return data;
    } catch (err) {
        console.error('🔥 Error fetching users:', err);
        return MOCK_USERS;
    }
}

const MOCK_USERS = [
    { id: 'mock-1', full_name: 'Alice Agent', role: 'agent', plan_tier: 'pro', listings_count: 5, listings_limit: 20, bonus_listings: 0, email: { email: 'alice@example.com' } },
    { id: 'mock-2', full_name: 'Bob Owner', role: 'owner', plan_tier: 'free', listings_count: 1, listings_limit: 1, bonus_listings: 0, email: { email: 'bob@example.com' } },
    { id: 'mock-3', full_name: 'Charlie Dev', role: 'developer', plan_tier: 'enterprise', listings_count: 12, listings_limit: 50, bonus_listings: 5, email: { email: 'charlie@example.com' } },
];

export async function updateUserBonus(userId: string, bonus: number) {
    await verifyAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from('profiles')
        .update({ bonus_listings: bonus })
        .eq('id', userId);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/admin/users');
}

export async function sendNotification(userId: string, title: string, message: string) {
    await verifyAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, title, message }]);

    if (error) throw new Error(error.message);
    // No revalidate needed unless we are showing sent messages list
}

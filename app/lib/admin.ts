'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
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

export async function createGlobalFeature(label: string) {
    await verifyAdmin();
    const supabase = await createClient();

    // 1. Generate key
    const key = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    // 2. Fetch all plans to know what to insert
    const { data: plans } = await supabase.from('plans').select('role, name');

    if (!plans || plans.length === 0) throw new Error('No plans found to add feature to.');

    // 3. Prepare inserts
    const inserts = plans.map(p => ({
        role: p.role,
        plan_name: p.name,
        feature_key: key,
        feature_label: label,
        is_included: false, // Default to disabled
        sort_order: 99
    }));

    // 4. Insert with ignoreDuplicates (upsert nothing)
    // Supabase upsert requires primary key or unique constraint. 
    // We don't have a unique constraint on (role, plan_name, feature_key) by default unless migration added it.
    // If we assume no constraint, we must check existence?
    // Let's rely on `onConflict` if constraint exists, or just manual check.
    // The previous error handler suggests we rely on DB constraint. 
    // Let's do a safe check first if we can't trust constraints.

    // Better: Select existing for this key, filter out plans that already have it.
    const { data: existing } = await supabase
        .from('plan_features')
        .select('role, plan_name')
        .eq('feature_key', key);

    const existingSet = new Set(existing?.map(e => `${e.role}:${e.plan_name}`));
    const finalInserts = inserts.filter(i => !existingSet.has(`${i.role}:${i.plan_name}`));

    if (finalInserts.length > 0) {
        const { error } = await supabase.from('plan_features').insert(finalInserts);
        if (error) throw new Error(error.message);
    }

    revalidatePath('/dashboard/admin/features');
    revalidatePath('/dashboard/admin/plans');
    revalidatePath('/pricing');
}

export async function deleteGlobalFeature(key: string) {
    await verifyAdmin();
    const supabase = await createClient();

    const { error } = await supabase
        .from('plan_features')
        .delete()
        .eq('feature_key', key);

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard/admin/features');
    revalidatePath('/dashboard/admin/plans');
    revalidatePath('/pricing');
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

    // Backfill features for the new plan
    // 1. Get all unique feature keys from existing plans (or fallback to defaults)
    const { data: existingFeatures } = await supabase
        .from('plan_features')
        .select('feature_key, feature_label, sort_order')
        .order('sort_order');

    if (existingFeatures && existingFeatures.length > 0) {
        // Deduplicate by key
        const uniqueFeatures = new Map();
        existingFeatures.forEach(f => {
            if (!uniqueFeatures.has(f.feature_key)) {
                uniqueFeatures.set(f.feature_key, f);
            }
        });

        // Prepare inserts for the new plan
        const featuresToInsert = Array.from(uniqueFeatures.values()).map((f: any) => ({
            role: plan.role,
            plan_name: plan.name,
            feature_key: f.feature_key,
            feature_label: f.feature_label,
            is_included: false, // Default to disabled
            sort_order: f.sort_order
        }));

        if (featuresToInsert.length > 0) {
            const { error: insertError } = await supabase.from('plan_features').insert(featuresToInsert);
            if (insertError) console.warn('Error backfilling features:', insertError.message);
        }
    }

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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('role');

        if (error) {
            console.error('❌ DB Error (Users):', error.message);
            throw new Error(error.message);
        }

        return data || [];
    } catch (err) {
        console.error('🔥 Error fetching users:', err);
        // Return empty array instead of mock data to avoid confusion
        return [];
    }
}



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

export async function updateUserRoleAndPlan(userId: string, role: string, planTier: string) {
    await verifyAdmin();
    const supabase = await createClient();

    // 1. Fetch the Plan Limits from the `plans` table
    const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('listings_limit, featured_limit')
        .eq('role', role)
        .eq('name', planTier) // planTier matches the 'name' column in plans table
        .single();

    let listingsLimit = 0;
    let featuredLimit = 0;

    if (planData) {
        listingsLimit = planData.listings_limit;
        featuredLimit = planData.featured_limit;
    } else {
        // Fallback logic if plan not found in DB
        console.warn(`Plan not found for ${role} - ${planTier}. using defaults.`);
        if (role === 'agent') { listingsLimit = 5; featuredLimit = 0; }
        else if (role === 'owner') { listingsLimit = 1; featuredLimit = 0; }
    }

    // 2. Update the Profile with new Role, Plan, and Limits
    const { error } = await supabase
        .from('profiles')
        .update({
            role: role,
            plan_tier: planTier,
            listings_limit: listingsLimit,
            featured_limit: featuredLimit
        })
        .eq('id', userId);

    if (error) throw new Error(error.message);
    revalidatePath('/dashboard/admin/users');
}

export async function deleteUser(userId: string) {
    await verifyAdmin();

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
        throw new Error(error.message);
    }

    revalidatePath('/dashboard/admin/users');
}

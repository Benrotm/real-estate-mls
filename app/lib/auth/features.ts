import { createClient } from '../supabase/server';
import { SYSTEM_FEATURES } from './feature-keys';

export { SYSTEM_FEATURES };
export type { SystemFeature } from './feature-keys';

/**
 * Checks if the current authenticated user has access to a specific feature based on their plan.
 */
export async function hasFeature(featureKey: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    // 1. Get user's role and plan name from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan_tier')
        .eq('id', user.id)
        .single();

    if (!profile) return false;

    // Super Admin override (optional, but good for debugging/management)
    if (profile.role === 'super_admin') return true;

    // 2. Check if the feature is included in their plan
    const { data: feature } = await supabase
        .from('plan_features')
        .select('is_included')
        .eq('role', profile.role)
        .eq('plan_name', profile.plan_tier)
        .eq('feature_key', featureKey)
        .single();

    return feature?.is_included ?? false;
}

/**
 * Checks if a specific user (e.g. property owner) has access to a feature based on their plan.
 */
export async function checkUserFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    const supabase = await createClient();

    // 1. Get user's role and plan name from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan_tier')
        .eq('id', userId)
        .single();

    if (!profile) return false;

    // Super Admin override
    if (profile.role === 'super_admin') return true;

    // 2. Check if the feature is included in their plan
    const { data: feature } = await supabase
        .from('plan_features')
        .select('is_included')
        .eq('role', profile.role)
        .eq('plan_name', profile.plan_tier)
        .eq('feature_key', featureKey)
        .single();

    return feature?.is_included ?? false;
}

export async function getUserFeatures(): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, plan_tier')
        .eq('id', user.id)
        .single();

    if (!profile) return [];

    if (profile.role === 'super_admin') {
        return Object.values(SYSTEM_FEATURES);
    }

    const { data: features } = await supabase
        .from('plan_features')
        .select('feature_key')
        .eq('role', profile.role)
        .eq('plan_name', profile.plan_tier)
        .eq('is_included', true);

    return features?.map(f => f.feature_key) || [];
}

/**
 * Bulk checks if multiple users have access to a specific feature.
 * Returns a map of userId -> boolean.
 */
export async function bulkCheckUserFeatureAccess(userIds: string[], featureKey: string): Promise<Record<string, boolean>> {
    const supabase = await createClient();
    if (!userIds || userIds.length === 0) return {};

    // 1. Get unique profiles
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role, plan_tier')
        .in('id', userIds);

    if (!profiles) return {};

    // 2. Identify unique role+plan combinations
    const uniquePlans = Array.from(new Set(profiles.map(p => `${p.role}:${p.plan_tier}`)));

    // 3. Fetch feature status for these combinations
    // We can't easily do a complex OR in one query for (role, plan) pairs without RPC or raw SQL.
    // However, unique plans will be few (Free, Pro, Premium * Agent, Owner).
    // Let's fetch relevant entries.
    const plansSplit = uniquePlans.map(s => {
        const [role, plan_tier] = s.split(':');
        return { role, plan_tier };
    });

    // To avoid N queries, we can just fetch ALL entries for this featureKey 
    // and filter in memory, assuming the table isn't huge (it is small).
    const { data: features } = await supabase
        .from('plan_features')
        .select('role, plan_name, is_included')
        .eq('feature_key', featureKey);

    if (!features) return {};

    // 4. Map back to users
    const result: Record<string, boolean> = {};

    profiles.forEach(profile => {
        if (profile.role === 'super_admin') {
            result[profile.id] = true;
            return;
        }

        const feature = features.find(f => f.role === profile.role && f.plan_name === profile.plan_tier);
        result[profile.id] = feature?.is_included ?? false;
    });

    return result;
}

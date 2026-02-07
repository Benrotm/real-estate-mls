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

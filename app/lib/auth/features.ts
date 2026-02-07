import { createClient } from '../supabase/server';
import { SYSTEM_FEATURES } from './feature-keys';

export { SYSTEM_FEATURES };
export type { SystemFeature } from './feature-keys';

/**
 * Checks if the current authenticated user has access to a specific feature based on their plan.
 */

/**
 * Helper to map simplified plan tiers (slugs) to possible Database Plan Names.
 * This handles mismatches where profiles store 'free' but plan_features stores 'Free Plan'.
 */
function getEquivalentPlanNames(role: string, tier: string): string[] {
    const t = tier.toLowerCase();
    const names = new Set<string>([tier]);

    // 1. Basic Capitalization
    names.add(tier.charAt(0).toUpperCase() + tier.slice(1)); // "Free", "Pro"
    names.add(tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan'); // "Free Plan", "Pro Plan"

    // 2. Role-specific mappings based on observed DB data
    if (role === 'agent') {
        if (t === 'pro') { names.add('Pro Real'); names.add('Professional'); }
        if (t === 'enterprise') { names.add('Full House Agency'); }
    }
    else if (role === 'owner') {
        if (t === 'pro') { names.add('Pro'); } // Redundant but safe
        if (t === 'enterprise') { names.add('Ultra Plan'); names.add('Premium'); }
    }
    else if (role === 'client') {
        if (t === 'pro') { names.add('Pro Client'); }
    }
    else if (role === 'developer') {
        if (t === 'pro') { names.add('Pro Plan'); }
    }

    return Array.from(names);
}

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
    const planNames = getEquivalentPlanNames(profile.role, profile.plan_tier || 'free');

    const { data: features } = await supabase
        .from('plan_features')
        .select('is_included')
        .eq('role', profile.role)
        .in('plan_name', planNames)
        .eq('feature_key', featureKey);

    // If ANY of the matching plan names allows the feature, return true.
    // Usually there should only be one match, but this makes it robust.
    return features?.some(f => f.is_included) ?? false;
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
    const planNames = getEquivalentPlanNames(profile.role, profile.plan_tier || 'free');

    const { data: features } = await supabase
        .from('plan_features')
        .select('is_included')
        .eq('role', profile.role)
        .in('plan_name', planNames)
        .eq('feature_key', featureKey);

    return features?.some(f => f.is_included) ?? false;
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

    const planNames = getEquivalentPlanNames(profile.role, profile.plan_tier || 'free');

    const { data: features } = await supabase
        .from('plan_features')
        .select('feature_key')
        .eq('role', profile.role)
        .in('plan_name', planNames)
        .eq('is_included', true);

    // Dedup features just in case
    return Array.from(new Set(features?.map(f => f.feature_key) || []));
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

    // 2. Fetch ALL features for this key (optimization: filtering in memory is cheaper than complex OR query)
    const { data: features } = await supabase
        .from('plan_features')
        .select('role, plan_name, is_included')
        .eq('feature_key', featureKey);

    if (!features) return {};

    // 3. Map back to users
    const result: Record<string, boolean> = {};

    profiles.forEach(profile => {
        if (profile.role === 'super_admin') {
            result[profile.id] = true;
            return;
        }

        const planNames = getEquivalentPlanNames(profile.role, profile.plan_tier || 'free');

        // Find if any of the possible plan names has this feature enabled
        const hasAccess = features.some(f =>
            f.role === profile.role &&
            planNames.includes(f.plan_name) &&
            f.is_included
        );

        result[profile.id] = hasAccess;
    });

    return result;
}


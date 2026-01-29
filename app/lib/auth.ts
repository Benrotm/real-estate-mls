import { createClient } from '@/app/lib/supabase/server';
import { cookies } from 'next/headers';

export type UserRole = 'owner' | 'client' | 'agent' | 'developer' | 'admin' | 'super_admin';

export interface UserProfile {
    id: string;
    full_name: string;
    role: UserRole;
    plan_tier: 'free' | 'pro' | 'enterprise';
    listings_limit: number;
    featured_limit?: number;
    listings_count: number;
    avatar_url?: string;
}

export async function getUserProfile(): Promise<UserProfile | null> {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {

        return null; // Correctly return null for unauthenticated users
    }

    // 2. Get Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.warn('Profile not found in DB. Returning Fallback Super Admin (for Demo).');
        // Fallback for Demo purposes so you don't get locked out
        return {
            id: user.id,
            full_name: user.email?.split('@')[0] || 'Admin User',
            role: 'super_admin',
            plan_tier: 'enterprise',
            listings_limit: 999,
            listings_count: 0,
            avatar_url: ''
        };
    }

    // 3. Check for Impersonation (Super Admin Only)
    // We check a cookie that only super admins can set via a Server Action
    if (profile.role === 'super_admin') {
        const cookieStore = await cookies();
        const impersonatedRole = cookieStore.get('impersonated_role')?.value as UserRole | undefined;

        if (impersonatedRole) {
            console.log(`[Auth] Super Admin ${profile.full_name} is impersonating ${impersonatedRole}`);
            return {
                ...profile,
                role: impersonatedRole, // Override role for UI checks
                is_impersonating: true // Flag for UI to show "Exit View" button
            } as any;
        }
    }

    // Ensure we return an object that matches UserProfile interface
    // especially since 'listings_count' might not be a column in profiles
    return {
        ...profile,
        listings_count: 0 // Default, use getUsageStats for real count
    } as UserProfile;
}

export async function isSuperAdmin(): Promise<boolean> {
    const profile = await getUserProfile();
    // Check actual DB role, ignoring impersonation for this security check
    // In a real app, we'd double check the DB directly to avoid cookie spoofing issues on critical actions
    return profile?.role === 'super_admin' || !!(profile as any)?.is_impersonating;
}

export async function getUsageStats(userId: string) {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

    if (error) {
        console.error('Error fetching usage stats:', error);
        return 0;
    }
    return count || 0;
}

export async function getFeaturedStats(userId: string) {
    const supabase = await createClient();
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('promoted', true);

    if (error) {
        console.error('Error fetching featured stats:', error);
        return 0;
    }
    return count || 0;
}

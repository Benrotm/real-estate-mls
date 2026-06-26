'use server';

import { createClient } from '@/app/lib/supabase/client';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const STORIA_AUTH_URL = process.env.STORIA_AUTH_URL || 'https://www.olx.ro/oauth/authorize/';

/**
 * Generates the Storia/OLX OAuth 2.0 authorization URL.
 */
export async function getStoriaAuthUrl() {
    const clientId = process.env.STORIA_CLIENT_ID;
    const redirectUri = process.env.STORIA_REDIRECT_URI || 'https://imobum.com/api/auth/storia/callback';

    if (!clientId) {
        console.error('STORIA_CLIENT_ID is not configured');
        return { error: 'Storia client ID not configured on the server.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const url = `${STORIA_AUTH_URL}?response_type=code&client_id=${clientId}&state=${user.id}&scope=v2+read+write&redirect_uri=${encodeURIComponent(redirectUri)}`;
    return { url };
}

/**
 * Retrieves the Storia connection and activation status for the current user.
 */
export async function getStoriaStatus(userId: string) {
    if (!userId) return { active: false, connected: false };

    const supabase = await createAdminClient();

    // 1. Check if the portal activation for Storia is active
    const { data: activation, error: actErr } = await supabase
        .from('portal_activations')
        .select('status')
        .eq('user_id', userId)
        .eq('portal_name', 'storia')
        .single();

    const isActive = !actErr && activation?.status === 'active';

    // 2. Check if a token exists for this user
    const { data: token, error: tokenErr } = await supabase
        .from('storia_tokens')
        .select('expires_at')
        .eq('user_id', userId)
        .single();

    const isConnected = !tokenErr && !!token;

    return {
        active: isActive,
        connected: isConnected,
        expiresAt: token?.expires_at || null
    };
}

/**
 * Disconnects the user's Storia/OLX account by deleting their token.
 */
export async function disconnectStoriaAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
        .from('storia_tokens')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error('Error disconnecting Storia account:', error);
        return { error: error.message };
    }

    revalidatePath('/cont/profil');
    return { success: true };
}

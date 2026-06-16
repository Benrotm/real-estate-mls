'use server';

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabase/client';
import { revalidatePath } from 'next/cache';

// Using a service role client for admin operations if needed, 
// though regular client is fine since RLS is configured.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requestPortalActivation(portalName: string, userId: string) {
    if (!userId) return { error: 'User ID is required' };

    const { data, error } = await supabaseAdmin
        .from('portal_activations')
        .upsert(
            { user_id: userId, portal_name: portalName, status: 'pending', requested_at: new Date().toISOString() },
            { onConflict: 'user_id,portal_name' }
        );

    if (error) {
        console.error('Error requesting activation:', error);
        return { error: error.message };
    }

    revalidatePath('/properties/add');
    return { success: true };
}

export async function getUserPortalActivations(userId: string) {
    if (!userId) return { data: [] };

    const { data, error } = await supabaseAdmin
        .from('portal_activations')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user activations:', error);
        return { data: [] };
    }

    return { data: data || [] };
}

export async function getAllPendingActivations() {
    const { data: activations, error } = await supabaseAdmin
        .from('portal_activations')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending activations:', error);
        return { data: [] };
    }

    if (!activations || activations.length === 0) {
        return { data: [] };
    }

    const userIds = [...new Set(activations.map(a => a.user_id))];

    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, phone, email')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles for activations:', profilesError);
    }

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enrichedActivations = activations.map(act => {
        const profile = profilesMap.get(act.user_id);
        return {
            ...act,
            profiles: profile || null,
            users: profile ? { email: profile.email } : null
        };
    });

    return { data: enrichedActivations };
}

export async function updateActivationStatus(id: string, status: 'active' | 'rejected') {
    const { error } = await supabaseAdmin
        .from('portal_activations')
        .update({ status, approved_at: status === 'active' ? new Date().toISOString() : null })
        .eq('id', id);

    if (error) {
        console.error('Error updating activation status:', error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/admin/portal-activations');
    return { success: true };
}

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
    const { data, error } = await supabaseAdmin
        .from('portal_activations')
        .select(`
            *,
            profiles!portal_activations_user_id_fkey(full_name, phone)
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

    // Try fetching with auth.users if profiles join fails
    if (error) {
        console.error('Error fetching pending activations with profiles:', error);
        
        // Fallback fetch
        const fallback = await supabaseAdmin
            .from('portal_activations')
            .select('*')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
            
        return { data: fallback.data || [] };
    }

    return { data: data || [] };
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

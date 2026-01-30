'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to check admin role
async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'super_admin') {
        throw new Error('Forbidden: Super Admin Access Required');
    }
    return { supabase, user };
}

// --- LEADS ---

export async function fetchAllLeadsAdmin() {
    const { supabase } = await checkAdmin();

    const { data, error } = await supabase
        .from('leads')
        .select(`
            *,
            agent:profiles!leads_agent_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Admin Fetch Leads Error:', error);
        return [];
    }
    return data;
}

export async function deleteLeadAdmin(leadId: string) {
    const { supabase } = await checkAdmin();

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

    if (error) throw new Error('Failed to delete lead');
    revalidatePath('/dashboard/admin/leads');
}

// --- PROPERTIES ---

export async function fetchAllPropertiesAdmin() {
    const { supabase } = await checkAdmin();

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Admin Fetch Properties Error:', error);
        return [];
    }
    return data;
}

export async function deletePropertyAdmin(propertyId: string) {
    const { supabase } = await checkAdmin();

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

    if (error) throw new Error('Failed to delete property');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
}

export async function updatePropertyStatusAdmin(propertyId: string, status: string) {
    const { supabase } = await checkAdmin();

    const { error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId);

    if (error) throw new Error('Failed to update property status');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/properties');
}

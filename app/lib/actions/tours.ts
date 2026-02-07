'use server';

import { createClient } from '@/app/lib/supabase/server';
import { VirtualTour } from '@/app/lib/tours';
import { revalidatePath } from 'next/cache';

export async function getVirtualTours(ownerId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('virtual_tours')
        .select(`
            *,
            property:properties(id, title),
            owner:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

    if (ownerId) {
        query = query.eq('owner_id', ownerId);
    } else {
        // If no ownerId is passed, default to the current authenticated user (My Tours)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            query = query.eq('owner_id', user.id);
        } else {
            // If checking public/all tours (e.g. admin), we might want to skip this filter,
            // but for the "Add Property" dropdown, we definitely want "My Tours".
            // Let's assume this action is primarily for the user context.
            // If we need "All Tours" for admin, we should pass a flag or handle differently.
            // For now, returning empty if not logged in is safer than returning all.
            return [];
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching tours:', error);
        return [];
    }
    return data as VirtualTour[];
}

export async function getVirtualTourById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('virtual_tours')
        .select(`
            *,
            property:properties(id, title),
            owner:profiles(full_name, email)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data as VirtualTour;
}

export async function createVirtualTour(initialData: { title: string, description?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('virtual_tours')
        .insert({
            owner_id: user.id,
            title: initialData.title,
            description: initialData.description || '',
            tour_data: { scenes: [] }, // Empty initial tour data
            status: 'draft'
        })
        .select()
        .single();

    if (error) {
        console.error('Create tour error:', error);
        return { error: error.message };
    }

    revalidatePath('/dashboard/owner/tours');
    return { success: true, data };
}

export async function updateVirtualTour(id: string, updates: Partial<VirtualTour>) {
    const supabase = await createClient();

    // Auth check relies on RLS, but helpful to check user here too
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Clean up updates object (remove joined fields if present)
    const { property, owner, created_at, updated_at, ...cleanUpdates } = updates as any;

    const { error } = await supabase
        .from('virtual_tours')
        .update({
            ...cleanUpdates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/owner/tours');
    revalidatePath(`/tours/${id}`);
    revalidatePath(`/dashboard/owner/tours/${id}/edit`);

    return { success: true };
}

export async function deleteVirtualTour(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('virtual_tours')
        .delete()
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/dashboard/owner/tours');
    return { success: true };
}

export async function saveTourData(id: string, tourData: any) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('virtual_tours')
        .update({
            tour_data: tourData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath(`/tours/${id}`);
    return { success: true };
}

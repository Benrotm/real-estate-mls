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
        console.error(`[AdminAccess] Access Denied for user ${user.id}. Role: ${profile?.role || 'None'}`);
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

export async function updatePropertyAdmin(propertyId: string, formData: FormData) {
    const { supabase } = await checkAdmin();

    try {
        // Parse fields - similar to createProperty but no owner_id override
        const featuresRaw = formData.get('features');
        const features = featuresRaw ? JSON.parse(featuresRaw as string) : [];
        const imagesRaw = formData.get('images');
        const images = imagesRaw ? JSON.parse(imagesRaw as string) : [];

        const propertyData: any = {
            title: formData.get('title') as string,
            listing_type: formData.get('listing_type') as string,
            type: formData.get('type') as string,
            price: parseFloat(formData.get('price') as string),
            currency: formData.get('currency') as string,
            description: formData.get('description') as string,

            // Location
            location_county: formData.get('location_county') as string,
            location_city: formData.get('location_city') as string,
            location_area: formData.get('location_area') as string,
            address: formData.get('address') as string,

            // Specs - parse numbers safely
            rooms: formData.get('rooms') ? parseInt(formData.get('rooms') as string) : null,
            bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
            bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms') as string) : null,

            area_usable: formData.get('area_usable') ? parseFloat(formData.get('area_usable') as string) : null,
            area_built: formData.get('area_built') ? parseFloat(formData.get('area_built') as string) : null,

            year_built: formData.get('year_built') ? parseInt(formData.get('year_built') as string) : null,
            floor: formData.get('floor') ? parseInt(formData.get('floor') as string) : null,
            total_floors: formData.get('total_floors') ? parseInt(formData.get('total_floors') as string) : null,

            partitioning: formData.get('partitioning') as string,
            comfort: formData.get('comfort') as string,

            // Enhanced
            building_type: formData.get('building_type') as string,
            interior_condition: formData.get('interior_condition') as string,
            furnishing: formData.get('furnishing') as string,

            // Media
            images: images,
            youtube_video_url: formData.get('youtube_video_url') as string,
            virtual_tour_url: formData.get('virtual_tour_url') as string,

            // Social/ID
            social_media_url: formData.get('social_media_url') as string,
            personal_property_id: formData.get('personal_property_id') as string,

            features: features,
            updated_at: new Date().toISOString()
        };

        // Remove nulls/undefined if needed, or Supabase handles them (sets to null)

        const { error } = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', propertyId);

        if (error) throw error;

        revalidatePath('/dashboard/admin/properties');
        revalidatePath('/properties');
        revalidatePath(`/properties/${propertyId}`);

        return { success: true };
    } catch (e: any) {
        console.error('Update Property Error:', e);
        return { error: e.message };
    }
}

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

export async function fetchAllPropertiesAdmin(params?: { page?: number; perPage?: number; filters?: any }): Promise<{ properties: any[]; totalCount: number }> {
    const { supabase } = await checkAdmin();

    const perPage = Math.min(params?.perPage || 15, 50);
    const page = Math.max(params?.page || 1, 1);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `, { count: 'exact' });

    // Apply filters (logic synced from properties.ts getProperties)
    const filters = params?.filters;
    if (filters) {
        if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.location_county) query = query.ilike('location_county', `%${filters.location_county}%`);
        if (filters.location_city) query = query.ilike('location_city', `%${filters.location_city}%`);
        if (filters.location_area) query = query.ilike('location_area', `%${filters.location_area}%`);
        if (filters.owner_phone) query = query.ilike('owner_phone', `%${filters.owner_phone}%`);
        if (filters.rooms) query = query.gte('rooms', filters.rooms);
        if (filters.bathrooms) query = query.gte('bathrooms', filters.bathrooms);
        if (filters.area) query = query.gte('area_usable', filters.area);
        if (filters.year_built) query = query.gte('year_built', filters.year_built);
        if (filters.floor) query = query.eq('floor', filters.floor);
        if (filters.partitioning) query = query.eq('partitioning', filters.partitioning);
        if (filters.comfort) query = query.eq('comfort', filters.comfort);
        if (filters.building_type) query = query.eq('building_type', filters.building_type);
        if (filters.interior_condition) query = query.eq('interior_condition', filters.interior_condition);
        if (filters.furnishing) query = query.eq('furnishing', filters.furnishing);

        if (filters.has_video === 'true' || filters.has_video === true) {
            query = query.not('video_url', 'is', null);
        }
        if (filters.has_virtual_tour === 'true' || filters.has_virtual_tour === true) {
            query = query.not('virtual_tour_url', 'is', null);
        }

        const featureTags = [];
        if (filters.commission_0 === 'true' || filters.commission_0 === true) featureTags.push('Commission 0%');
        if (filters.exclusive === 'true' || filters.exclusive === true) featureTags.push('Exclusive');
        if (filters.luxury === 'true' || filters.luxury === true) featureTags.push('Luxury');
        if (filters.foreclosure === 'true' || filters.foreclosure === true) featureTags.push('Foreclosure');
        if (filters.features) {
            if (Array.isArray(filters.features)) featureTags.push(...filters.features);
            else if (typeof filters.features === 'string') featureTags.push(filters.features);
        }
        if (featureTags.length > 0) query = query.contains('features', featureTags);
    }

    const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Admin Fetch Properties Error:', error);
        return { properties: [], totalCount: 0 };
    }
    return { properties: data || [], totalCount: count || 0 };
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

            // Private Fields
            private_notes: formData.get('private_notes') as string,
            documents: formData.get('documents') ? JSON.parse(formData.get('documents') as string) : [],
            owner_name: formData.get('owner_name') as string,
            owner_phone: formData.get('owner_phone') as string,

            // Contract Fields
            contract_country: formData.get('contract_country') as string || null,
            contract_city: formData.get('contract_city') as string || null,
            contract_street: formData.get('contract_street') as string || null,
            contract_building: formData.get('contract_building') as string || null,
            contract_floor: formData.get('contract_floor') as string || null,
            contract_apartment: formData.get('contract_apartment') as string || null,
            contract_cf_topo: formData.get('contract_cf_topo') as string || null,
            contract_owner_id: formData.get('contract_owner_id') as string || null,
            contract_owner_cnp: formData.get('contract_owner_cnp') as string || null,

            publish_imobiliare: formData.get('publish_imobiliare') === 'true',
            publish_storia: formData.get('publish_storia') === 'true',
            publish_romimo: formData.get('publish_romimo') === 'true',
            publish_homezz: formData.get('publish_homezz') === 'true',
            publish_imobiliarepret: formData.get('publish_imobiliarepret') === 'true',
            publish_whatsapp_groups: formData.get('publish_whatsapp_groups') === 'true',
            publish_facebook_groups: formData.get('publish_facebook_groups') === 'true',
            publish_facebook_page: formData.get('publish_facebook_page') === 'true',
            publish_instagram: formData.get('publish_instagram') === 'true',
            publish_tiktok: formData.get('publish_tiktok') === 'true',

            features: features,
            updated_at: new Date().toISOString()
        };

        // Recalculate score on update to catch corrections (e.g. adding partitioning)
        const { calculatePropertyScore } = await import('./scoring');
        const score = await calculatePropertyScore(propertyData);
        propertyData.score = score;

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

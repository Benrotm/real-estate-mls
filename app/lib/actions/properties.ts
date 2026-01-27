'use server';

import { createClient } from '@/app/lib/supabase/server';
import { Property, Property as PropertyType } from '@/app/lib/properties'; // Alias to avoid confusion if needed
import { revalidatePath } from 'next/cache';

export async function createProperty(formData: any) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Prepare data
    const propertyData = {
        owner_id: user.id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        currency: formData.currency,

        location_county: formData.location_county,
        location_city: formData.location_city,
        location_area: formData.location_area,
        address: formData.address,

        rooms: parseInt(formData.rooms) || null,
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseInt(formData.bathrooms) || null,

        area_usable: parseFloat(formData.area_usable) || null,
        area_built: parseFloat(formData.area_built) || null,

        year_built: parseInt(formData.year_built) || null,
        floor: parseInt(formData.floor) || null,
        total_floors: parseInt(formData.total_floors) || null,

        partitioning: formData.partitioning,
        comfort: formData.comfort,

        features: formData.features || [],

        // TODO: Handle Image Uploads separately or pass URLs
        images: formData.images || [],

        status: 'active'
    };

    const { data, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

    if (error) {
        console.error('Error creating property:', error);
        return { error: error.message };
    }

    revalidatePath('/properties');
    revalidatePath('/dashboard/owner');

    return { success: true, data };
}

export async function getProperties(filters?: any) {
    const supabase = await createClient();

    let query = supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name, email, phone, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
        if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.city) query = query.ilike('location_city', `%${filters.city}%`);
        if (filters.rooms) query = query.gte('rooms', filters.rooms);

        // Boolean filters
        // Adjust based on how features are stored (jsonb array)
        if (filters.features && filters.features.length > 0) {
            query = query.contains('features', filters.features); // Supabase JSONB contains
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }

    return data as PropertyType[];
}

export async function getPropertyById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name, email, phone, avatar_url)
        `)
        .eq('id', id)
        .single();

    if (error) return null;
    return data as PropertyType;
}

export async function getUserProperties() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return [];
    return data as PropertyType[];
}

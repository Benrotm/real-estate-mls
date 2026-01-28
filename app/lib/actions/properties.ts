'use server';

import { createClient } from '@/app/lib/supabase/server';
import { Property, Property as PropertyType } from '@/app/lib/properties'; // Alias to avoid confusion if needed
import { revalidatePath } from 'next/cache';

export async function createProperty(formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        // Extract and parse fields
        const featuresRaw = formData.get('features');
        const features = featuresRaw ? JSON.parse(featuresRaw as string) : [];

        // Prepare data matching the DB schema
        const propertyData = {
            owner_id: user.id,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as string,
            listing_type: formData.get('listing_type') as string,
            price: parseFloat(formData.get('price') as string),
            currency: formData.get('currency') as string,

            // Location
            location_county: formData.get('location_county') as string,
            location_city: formData.get('location_city') as string,
            location_area: formData.get('location_area') as string,
            address: formData.get('address') as string,

            // Specs
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

            // Details
            features: features,

            // Media (handling placeholder or array)
            // images: formData.getAll('images') as string[], // If passing multiselect or similar
            // For now assuming we might receive a JSON string of URLs or just ignore

            video_url: formData.get('video_url') as string, // Legacy if needed
            youtube_video_url: formData.get('youtube_video_url') as string,
            virtual_tour_url: formData.get('virtual_tour_url') as string,

            status: 'active'
        };

        const { data, error } = await supabase
            .from('properties')
            .insert(propertyData)
            .select(`
            *,
            owner:profiles(full_name)
        `).single();

        if (error) {
            console.error('Error creating property:', error);
            return { error: error.message };
        }

        revalidatePath('/properties');
        revalidatePath('/dashboard/owner');

        return { success: true, data };
    } catch (e: any) {
        console.error('Unexpected error in createProperty:', e);
        return { error: e.message || 'Internal Server Error' };
    }
}

export async function getProperties(filters?: any) {
    const supabase = await createClient();

    let query = supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // Apply filters
    // Apply filters
    if (filters) {
        if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
        if (filters.type) query = query.eq('type', filters.type);

        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);

        // Location
        if (filters.location_county) query = query.ilike('location_county', `%${filters.location_county}%`);
        if (filters.city) query = query.ilike('location_city', `%${filters.city}%`); // keeping 'city' param support if used elsewhere
        if (filters.location_city) query = query.ilike('location_city', `%${filters.location_city}%`);
        if (filters.location_area) query = query.ilike('location_area', `%${filters.location_area}%`);

        // Specs
        if (filters.rooms) query = query.gte('rooms', filters.rooms);
        if (filters.bathrooms) query = query.gte('bathrooms', filters.bathrooms);
        if (filters.area) query = query.gte('area_usable', filters.area); // 'area' filter maps to area_usable

        if (filters.year_built) query = query.gte('year_built', filters.year_built);
        if (filters.floor) query = query.eq('floor', filters.floor); // Exact match for floor or range? UI sends exact value usually

        // Advanced
        if (filters.partitioning) query = query.eq('partitioning', filters.partitioning);
        if (filters.comfort) {
            query = query.eq('comfort', filters.comfort);
        }

        // New Filters
        if (filters.building_type) {
            query = query.eq('building_type', filters.building_type);
        }
        if (filters.interior_condition) {
            query = query.eq('interior_condition', filters.interior_condition);
        }
        if (filters.furnishing) {
            query = query.eq('furnishing', filters.furnishing);
        }

        // Media Filters
        if (filters.has_video === 'true') {
            // Check if either youtube_video_url OR video_url OR virtual_tour_url is present ??
            // Or just youtube_video_url. The prompt said "video link".
            // Supabase doesn't support complex ORs easily in chain without 'or'.
            // Let's just check youtube_video_url for now as that's the main "video".
            query = query.not('youtube_video_url', 'is', null);
        }

        // Sort
        if (filters.sort) {
            switch (filters.sort) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Boolean / Content Checks
        if (filters.has_video === 'true' || filters.has_video === true) {
            query = query.not('video_url', 'is', null);
        }
        if (filters.has_virtual_tour === 'true' || filters.has_virtual_tour === true) {
            query = query.not('virtual_tour_url', 'is', null);
        }

        // Feature flags (assuming they are stored in 'features' JSONB array)
        // We'll collect all tags to search for
        const featureTags = [];
        if (filters.commission_0 === 'true' || filters.commission_0 === true) featureTags.push('Commission 0%');
        if (filters.exclusive === 'true' || filters.exclusive === true) featureTags.push('Exclusive');
        if (filters.luxury === 'true' || filters.luxury === true) featureTags.push('Luxury');
        if (filters.hotel_regime === 'true' || filters.hotel_regime === true) featureTags.push('Hotel Regime');
        if (filters.foreclosure === 'true' || filters.foreclosure === true) featureTags.push('Foreclosure');

        if (filters.features) {
            if (Array.isArray(filters.features)) {
                featureTags.push(...filters.features);
            } else if (typeof filters.features === 'string') {
                featureTags.push(filters.features);
            }
        }

        if (featureTags.length > 0) {
            query = query.contains('features', featureTags);
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching properties:', error);
        return [];
    }

    return (data || []).map((p: any) => ({
        ...p,
        bedrooms: p.bedrooms ?? p.beds,
        bathrooms: p.bathrooms ?? p.baths,
        area_usable: p.area_usable ?? p.sqft,
        type: p.type ?? p.property_type,
        location_city: p.location_city ?? p.city,
    })) as PropertyType[];
}

export async function getPropertyById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `)
        .eq('id', id)
        .single();

    if (error || !data) return null;

    // Map legacy fields
    const p = data as any;
    return {
        ...p,
        bedrooms: p.bedrooms ?? p.beds,
        bathrooms: p.bathrooms ?? p.baths,
        area_usable: p.area_usable ?? p.sqft,
        type: p.type ?? p.property_type,
        location_city: p.location_city ?? p.city,
    } as PropertyType;
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

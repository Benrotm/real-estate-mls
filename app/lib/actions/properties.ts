'use server';

import { createClient } from '@/app/lib/supabase/server';
import { Property, Property as PropertyType } from '@/app/lib/properties';
import { revalidatePath } from 'next/cache';
import { calculatePropertyScore } from './scoring';
import { getUserProfile, getActiveUsageStats } from '../auth';
import { generatePropertyFingerprint } from '../utils/fingerprint';
import { getAdminSettings } from './admin-settings';

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
            latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
            longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,

            // Specs
            rooms: formData.get('rooms') ? parseInt(formData.get('rooms') as string) : null,
            bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
            bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms') as string) : null,

            area_usable: formData.get('area_usable') ? parseFloat(formData.get('area_usable') as string) : null,
            area_built: formData.get('area_built') ? parseFloat(formData.get('area_built') as string) : null,
            area_box: formData.get('area_box') ? parseFloat(formData.get('area_box') as string) : null,
            area_terrace: formData.get('area_terrace') ? parseFloat(formData.get('area_terrace') as string) : null,
            area_garden: formData.get('area_garden') ? parseFloat(formData.get('area_garden') as string) : null,

            year_built: formData.get('year_built') ? parseInt(formData.get('year_built') as string) : null,
            floor: formData.get('floor') ? parseInt(formData.get('floor') as string) : null,
            total_floors: formData.get('total_floors') ? parseInt(formData.get('total_floors') as string) : null,

            partitioning: formData.get('partitioning') as string,
            comfort: formData.get('comfort') as string,

            // Enhanced
            building_type: formData.get('building_type') as string,
            interior_condition: formData.get('interior_condition') as string,
            furnishing: formData.get('furnishing') as string,

            // New Requests
            social_media_url: formData.get('social_media_url') as string,
            personal_property_id: formData.get('personal_property_id') as string,

            // Details
            features: features,

            // Media
            // If images are passed as JSON string of URLs
            images: formData.get('images') ? JSON.parse(formData.get('images') as string) : [],

            video_url: formData.get('video_url') as string,
            youtube_video_url: formData.get('youtube_video_url') as string,
            virtual_tour_url: formData.get('virtual_tour_url') as string,

            publish_imobiliare: formData.get('publish_imobiliare') === 'true',
            publish_storia: formData.get('publish_storia') === 'true',

            status: (formData.get('status') as 'active' | 'draft') || 'active'
        };

        // Calculate property score
        const score = await calculatePropertyScore(propertyData as Partial<Property>);

        // Check limits if status is active
        if (propertyData.status === 'active') {
            const profile = await getUserProfile();
            if (profile) {
                const currentUsage = await getActiveUsageStats(profile.id);
                const limit = (profile.listings_limit || 1) + (profile.bonus_listings || 0);
                if (currentUsage >= limit) {
                    return { error: `Active listing limit reached (${limit}). Please save as draft.` };
                }
            }
        }

        // Anti-Duplicate Intelligence Layer
        const fingerprint = generatePropertyFingerprint(propertyData);
        const settings = await getAdminSettings();

        let is_duplicate = false;
        if (settings.enable_anti_duplicate_intelligence) {
            // Check if this fingerprint already exists
            const { count } = await supabase
                .from('properties')
                .select('id', { count: 'exact', head: true })
                .eq('fingerprint', fingerprint);

            if (count && count > 0) {
                is_duplicate = true;
            }
        }

        const { data, error } = await supabase
            .from('properties')
            .insert({ ...propertyData, score, fingerprint, is_duplicate })
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

export async function getProperties(filters?: any): Promise<{ properties: PropertyType[], totalCount: number }> {
    const supabase = await createClient();

    let query = supabase
        .from('properties')
        .select(`
            *,
            owner:profiles(full_name)
        `, { count: 'exact' })
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
        // Hotel Regime moved to listing_type
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

    // Apply per-page limit and offset for pagination
    const perPage = Math.min(parseInt(filters?.per_page) || 15, 50);
    const page = Math.max(parseInt(filters?.page) || 1, 1);
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
        console.error('Error fetching properties:', error);
        return { properties: [], totalCount: 0 };
    }

    const properties = (data || []).map((p: any) => ({
        ...p,
        bedrooms: p.bedrooms ?? p.beds,
        bathrooms: p.bathrooms ?? p.baths,
        area_usable: p.area_usable ?? p.sqft,
        type: p.type ?? p.property_type,
        location_city: p.location_city ?? p.city,
    })) as PropertyType[];

    return { properties, totalCount: count || 0 };
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

export async function updateProperty(id: string, formData: FormData) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Verify ownership or admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'super_admin';

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (!property || (property.owner_id !== user.id && !isAdmin)) {
        return { error: 'Unauthorized: You do not own this property' };
    }

    try {
        // Extract and parse fields
        const featuresRaw = formData.get('features');
        const features = featuresRaw ? JSON.parse(featuresRaw as string) : [];

        // Prepare data matching the DB schema
        const propertyData = {
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
            latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
            longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,

            // Specs
            rooms: formData.get('rooms') ? parseInt(formData.get('rooms') as string) : null,
            bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
            bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms') as string) : null,

            area_usable: formData.get('area_usable') ? parseFloat(formData.get('area_usable') as string) : null,
            area_built: formData.get('area_built') ? parseFloat(formData.get('area_built') as string) : null,
            area_box: formData.get('area_box') ? parseFloat(formData.get('area_box') as string) : null,
            area_terrace: formData.get('area_terrace') ? parseFloat(formData.get('area_terrace') as string) : null,
            area_garden: formData.get('area_garden') ? parseFloat(formData.get('area_garden') as string) : null,

            year_built: formData.get('year_built') ? parseInt(formData.get('year_built') as string) : null,
            floor: formData.get('floor') ? parseInt(formData.get('floor') as string) : null,
            total_floors: formData.get('total_floors') ? parseInt(formData.get('total_floors') as string) : null,

            partitioning: formData.get('partitioning') as string,
            comfort: formData.get('comfort') as string,

            // Enhanced
            building_type: formData.get('building_type') as string,
            interior_condition: formData.get('interior_condition') as string,
            furnishing: formData.get('furnishing') as string,

            // New Requests
            social_media_url: formData.get('social_media_url') as string,
            personal_property_id: formData.get('personal_property_id') as string,

            // Private Fields
            private_notes: formData.get('private_notes') as string,
            documents: formData.get('documents') ? JSON.parse(formData.get('documents') as string) : [],
            owner_name: formData.get('owner_name') as string,
            owner_phone: formData.get('owner_phone') as string,

            // Details
            features: features,

            // Media
            // Only update images if provided
            ...(formData.get('images') ? { images: JSON.parse(formData.get('images') as string) } : {}),

            video_url: formData.get('video_url') as string,
            youtube_video_url: formData.get('youtube_video_url') as string,
            virtual_tour_url: formData.get('virtual_tour_url') as string,

            // updated_at is handled by DB trigger usually, but we can set it if needed
            updated_at: new Date().toISOString(),
            status: (formData.get('status') as 'active' | 'draft') || 'active'
        };

        // Calculate property score
        const score = await calculatePropertyScore(propertyData as Partial<Property>);

        const { data, error } = await supabase
            .from('properties')
            .update({ ...propertyData, score })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating property:', error);
            return { error: error.message };
        }

        revalidatePath('/properties');
        revalidatePath('/dashboard/owner');
        revalidatePath(`/properties/${id}`);
        revalidatePath(`/dashboard/owner/properties`);

        return { success: true, data };
    } catch (e: any) {
        console.error('Unexpected error in updateProperty:', e);
        return { error: e.message || 'Internal Server Error' };
    }
}

export async function togglePropertyStatus(id: string, currentStatus: 'active' | 'draft') {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Verify ownership
    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (!property || property.owner_id !== user.id) {
        return { error: 'Unauthorized' };
    }

    const newStatus = currentStatus === 'active' ? 'draft' : 'active';

    if (newStatus === 'active') {
        const profile = await getUserProfile();
        if (profile) {
            const currentUsage = await getActiveUsageStats(profile.id);
            const limit = (profile.listings_limit || 1) + (profile.bonus_listings || 0);
            if (currentUsage >= limit) {
                return { error: `Active listing limit reached (${limit}). Cannot publish.` };
            }
        }
    }

    const { error } = await supabase
        .from('properties')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/properties');
    revalidatePath('/dashboard/owner');
    revalidatePath('/dashboard/agent');
    revalidatePath(`/dashboard/owner/properties`);
    revalidatePath(`/dashboard/agent/listings`);
    revalidatePath(`/properties/${id}`);

    return { success: true, status: newStatus };
}

export async function createPropertyFromData(data: Partial<PropertyType>, sourceUrl?: string) {
    console.log('createPropertyFromData received:', {
        url: sourceUrl,
        private_notes: data.private_notes,
        has_url_in_object: 'url' in data
    });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    try {
        const propertyData = {
            owner_id: user.id,
            title: data.title || 'Untitled Scraped Property',
            description: data.description || '',
            price: data.price || 0,
            currency: data.currency || 'EUR',
            type: data.type || 'Apartment',
            listing_type: data.listing_type || 'sale',
            status: 'draft', // Always draft for safety

            // Contact (Scraped)
            owner_name: data.owner_name || '',
            owner_phone: data.owner_phone || '',
            private_notes: `${data.private_notes || ''}\n\nOriginal Link: ${sourceUrl || (data as any).url || 'N/A'}`.trim(),

            // Media
            images: data.images || [],
            video_url: data.video_url || '',
            virtual_tour_url: data.virtual_tour_url || '',

            // Location
            address: data.address || '',
            location_city: data.location_city || 'Timisoara',
            location_county: data.location_county || 'Timis',
            location_area: data.location_area || '',

            // Specs
            rooms: (data.rooms && data.rooms > 0 && data.rooms < 100) ? data.rooms : null,
            bedrooms: (data.bedrooms && data.bedrooms > 0 && data.bedrooms < 100) ? data.bedrooms : null,
            bathrooms: (data.bathrooms && data.bathrooms > 0 && data.bathrooms < 100) ? data.bathrooms : null,

            area_usable: data.area_usable || null,
            area_built: data.area_built || null,
            area_terrace: data.area_terrace || null,
            area_garden: data.area_garden || null,

            // Clamp floors to realistic values to avoid integer overflow from bad scraping (e.g. IDs)
            floor: (data.floor !== undefined && data.floor !== null && data.floor > -20 && data.floor < 200) ? data.floor : null,
            total_floors: (data.total_floors && data.total_floors > 0 && data.total_floors < 200) ? data.total_floors : null,

            // Validate year built (e.g. 1700 - 2100). Scrapers often pick up IDs or Phone numbers here by mistake.
            year_built: (data.year_built && data.year_built > 1700 && data.year_built < 2100) ? data.year_built : null,

            partitioning: data.partitioning || '',
            comfort: data.comfort || '',

            building_type: data.building_type || '',
            interior_condition: data.interior_condition || '',
            furnishing: data.furnishing || '',

            features: data.features || [],
            updated_at: new Date().toISOString()
        };

        // Anti-Duplicate Intelligence Layer
        const fingerprint = generatePropertyFingerprint(propertyData);
        const settings = await getAdminSettings();

        let is_duplicate = false;
        if (settings.enable_anti_duplicate_intelligence) {
            const { count } = await supabase
                .from('properties')
                .select('id', { count: 'exact', head: true })
                .eq('fingerprint', fingerprint);

            if (count && count > 0) {
                is_duplicate = true;
            }
        }

        const { data: newProperty, error } = await supabase
            .from('properties')
            .insert({ ...propertyData, fingerprint, is_duplicate })
            .select()
            .single();

        if (error) {
            console.error('Error creating property from scrape:', error);
            return { error: error.message };
        }

        revalidatePath('/properties');
        revalidatePath('/dashboard/admin/properties');

        return { success: true, data: newProperty };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteProperty(id: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Verify ownership or admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'super_admin';

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (!property || (property.owner_id !== user.id && !isAdmin)) {
        return { error: 'Unauthorized: You do not own this property' };
    }

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/properties');
    revalidatePath('/dashboard/owner');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/dashboard/admin/my-properties');
    revalidatePath(`/dashboard/owner/properties`);

    return { success: true };
}

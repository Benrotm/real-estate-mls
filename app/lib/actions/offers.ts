'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface PropertyOffer {
    id: string;
    property_id: string;
    user_id: string | null;
    offer_amount: number;
    currency: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    message: string | null;
    status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'expired';
    created_at: string;
    updated_at: string;
}

export interface PropertyInquiry {
    id: string;
    property_id: string;
    user_id: string | null;
    conversation_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    message: string | null;
    status: 'pending' | 'viewed' | 'contacted' | 'spam';
    created_at: string;
    updated_at: string;
}

export interface PropertyWithOffers {
    id: string;
    title: string;
    price: number;
    currency: string;
    listing_type: string;
    property_type: string;
    images: string[];
    city: string;
    county: string;
    status: string;
    friendly_id?: string;
    promoted?: boolean;
    score?: number;
    is_published: boolean;
    created_at: string;
    views_count: number;
    favorites_count: number;
    inquiries_count: number;
    shares_count: number;
    features: string[];
    offers: PropertyOffer[];
    inquiries: PropertyInquiry[];
}

// Get all properties with their offers for the current user (owner/agent)
export async function getUserPropertiesWithOffers(filters?: any): Promise<PropertyWithOffers[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Get user's properties
    let query = supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id);

    // Apply filters (logic synced from properties.ts getUserProperties)
    if (filters) {
        if (filters.listing_type) query = query.eq('listing_type', filters.listing_type);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.location_county) query = query.ilike('location_county', `%${filters.location_county}%`);
        if (filters.location_city) query = query.ilike('location_city', `%${filters.location_city}%`);
        if (filters.location_area) query = query.ilike('location_area', `%${filters.location_area}%`);
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

    const { data: properties, error: propsError } = await query
        .order('created_at', { ascending: false });

    if (propsError || !properties) {
        console.error('Error fetching properties:', propsError);
        return [];
    }

    // Get offers for all properties
    const propertyIds = properties.map(p => p.id);

    const { data: offers, error: offersError } = await supabase
        .from('property_offers')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

    if (offersError) {
        console.error('Error fetching offers:', offersError);
    }

    // Get analytics counts for each property
    const [viewsData, favoritesData, inquiriesData, sharesData] = await Promise.all([
        supabase.from('property_views').select('property_id').in('property_id', propertyIds),
        supabase.from('property_favorites').select('property_id').in('property_id', propertyIds),
        supabase.from('property_inquiries').select('property_id').in('property_id', propertyIds),
        supabase.from('property_shares').select('property_id').in('property_id', propertyIds),
    ]);

    // Get inquiries for all properties
    const { data: detailInquiries, error: inquiriesError } = await supabase
        .from('property_inquiries')
        .select('*')
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

    if (inquiriesError) {
        console.error('Error fetching inquiries:', inquiriesError);
    }

    // Build count maps
    const viewsCount: Record<string, number> = {};
    const favoritesCount: Record<string, number> = {};
    const inquiriesCount: Record<string, number> = {};
    const sharesCount: Record<string, number> = {};

    viewsData.data?.forEach(v => {
        viewsCount[v.property_id] = (viewsCount[v.property_id] || 0) + 1;
    });
    favoritesData.data?.forEach(f => {
        favoritesCount[f.property_id] = (favoritesCount[f.property_id] || 0) + 1;
    });
    inquiriesData.data?.forEach(i => {
        inquiriesCount[i.property_id] = (inquiriesCount[i.property_id] || 0) + 1;
    });
    sharesData.data?.forEach(s => {
        sharesCount[s.property_id] = (sharesCount[s.property_id] || 0) + 1;
    });

    // Combine properties with their offers
    return properties.map(property => ({
        id: property.id,
        title: property.title,
        price: property.price,
        currency: property.currency || 'EUR',
        listing_type: property.listing_type,
        property_type: property.property_type,
        images: property.images || [],
        city: property.location_city,
        county: property.location_county,
        status: property.status,
        friendly_id: property.friendly_id,
        promoted: property.promoted,
        score: property.score,
        is_published: property.status === 'active',
        created_at: property.created_at,
        views_count: viewsCount[property.id] || 0,
        favorites_count: favoritesCount[property.id] || 0,
        inquiries_count: inquiriesCount[property.id] || 0,
        shares_count: sharesCount[property.id] || 0,
        features: property.features || [],
        offers: (offers || []).filter(o => o.property_id === property.id),
        inquiries: (detailInquiries || []).filter(i => i.property_id === property.id)
    }));
}


// Get offers for a specific property
export async function getPropertyOffers(propertyId: string): Promise<PropertyOffer[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('property_offers')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching property offers:', error);
        return [];
    }

    return data || [];
}

// Update offer status
export async function updateOfferStatus(offerId: string, status: 'pending' | 'viewed' | 'accepted' | 'rejected' | 'expired') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the property
    const { data: offer } = await supabase
        .from('property_offers')
        .select('property_id')
        .eq('id', offerId)
        .single();

    if (!offer) {
        return { success: false, error: 'Offer not found' };
    }

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', offer.property_id)
        .single();

    if (!property || property.owner_id !== user.id) {
        return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
        .from('property_offers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', offerId);

    if (error) {
        console.error('Error updating offer status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/owner/properties');
    return { success: true };
}

// Delete an offer
export async function deleteOffer(offerId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the property
    const { data: offer } = await supabase
        .from('property_offers')
        .select('property_id')
        .eq('id', offerId)
        .single();

    if (!offer) {
        return { success: false, error: 'Offer not found' };
    }

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', offer.property_id)
        .single();

    if (!property || property.owner_id !== user.id) {
        return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
        .from('property_offers')
        .delete()
        .eq('id', offerId);

    if (error) {
        console.error('Error deleting offer:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/owner/properties');
    return { success: true };
}

// Update inquiry status
export async function updateInquiryStatus(inquiryId: string, status: 'pending' | 'viewed' | 'contacted' | 'spam') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the property
    const { data: inquiry } = await supabase
        .from('property_inquiries')
        .select('property_id')
        .eq('id', inquiryId)
        .single();

    if (!inquiry) {
        return { success: false, error: 'Inquiry not found' };
    }

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', inquiry.property_id)
        .single();

    if (!property || property.owner_id !== user.id) {
        return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
        .from('property_inquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', inquiryId);

    if (error) {
        console.error('Error updating inquiry status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/owner/properties');
    return { success: true };
}

// Delete an inquiry
export async function deleteInquiry(inquiryId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Not authenticated' };
    }

    // Verify user owns the property
    const { data: inquiry } = await supabase
        .from('property_inquiries')
        .select('property_id')
        .eq('id', inquiryId)
        .single();

    if (!inquiry) {
        return { success: false, error: 'Inquiry not found' };
    }

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', inquiry.property_id)
        .single();

    if (!property || property.owner_id !== user.id) {
        return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
        .from('property_inquiries')
        .delete()
        .eq('id', inquiryId);

    if (error) {
        console.error('Error deleting inquiry:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/agent/listings');
    revalidatePath('/dashboard/owner/properties');
    return { success: true };
}

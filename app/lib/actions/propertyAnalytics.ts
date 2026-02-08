'use server';

import { createClient } from '@/app/lib/supabase/server';

// Record a property page view
export async function recordPropertyView(propertyId: string, sessionHash?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('property_views').insert({
        property_id: propertyId,
        viewer_id: user?.id || null,
        session_hash: sessionHash || null
    });

    if (error) {
        console.error('Error recording property view:', error);
    }
}

// Get analytics summary for a property
export async function getPropertyAnalytics(propertyId: string) {
    try {
        const supabase = await createClient();

        // Get counts in parallel - wrap each in case one table fails or ID is invalid
        const results = await Promise.allSettled([
            supabase.from('property_views').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
            supabase.from('property_favorites').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
            supabase.from('property_inquiries').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
            supabase.from('property_offers').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
            supabase.from('property_shares').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
            supabase.from('properties').select('created_at').eq('id', propertyId).single()
        ]);

        const getCount = (res: any) => (res.status === 'fulfilled' && res.value?.count) ? res.value.count : 0;
        const getPropData = (res: any) => (res.status === 'fulfilled' && res.value?.data) ? res.value.data : null;

        return {
            views: getCount(results[0]),
            favorites: getCount(results[1]),
            inquiries: getCount(results[2]),
            offers: getCount(results[3]),
            shares: getCount(results[4]),
            createdAt: getPropData(results[5])?.created_at || null
        };
    } catch (error) {
        console.error('Error fetching property analytics:', error);
        return {
            views: 0,
            favorites: 0,
            inquiries: 0,
            offers: 0,
            shares: 0,
            createdAt: null
        };
    }
}

// Toggle favorite for a property
export async function togglePropertyFavorite(propertyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Must be logged in to favorite' };
    }

    // Check if already favorited
    const { data: existing } = await supabase
        .from('property_favorites')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        // Remove favorite
        const { error } = await supabase
            .from('property_favorites')
            .delete()
            .eq('id', existing.id);

        return { success: !error, isFavorited: false };
    } else {
        // Add favorite
        const { error } = await supabase.from('property_favorites').insert({
            property_id: propertyId,
            user_id: user.id
        });

        return { success: !error, isFavorited: true };
    }
}

// Check if user has favorited a property
export async function checkPropertyFavorite(propertyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
        .from('property_favorites')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single();

    return !!data;
}

// Submit property inquiry (from contact form)
export async function submitPropertyInquiry(propertyId: string, data: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
}) {
    const supabase = await createClient();

    const { error } = await supabase.from('property_inquiries').insert({
        property_id: propertyId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message || null
    });

    if (error) {
        console.error('Error submitting inquiry:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}


// Record property share
export async function recordPropertyShare(propertyId: string, shareMethod?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('property_shares').insert({
        property_id: propertyId,
        user_id: user?.id || null,
        share_method: shareMethod || null
    });

    if (error) {
        console.error('Error recording share:', error);
    }
}

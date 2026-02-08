'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Record a property page view
export async function recordPropertyView(propertyId: string, sessionHash?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Deduplication check: if sessionHash is provided, don't record if already exists in last 24h
    if (sessionHash) {
        const { data: existing } = await supabase
            .from('property_views')
            .select('id')
            .eq('property_id', propertyId)
            .eq('session_hash', sessionHash)
            .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)
            .single();

        if (existing) return;
    }

    const { error } = await supabase.from('property_views').insert({
        property_id: propertyId,
        viewer_id: user?.id || null,
        session_hash: sessionHash || null
    });

    if (error) {
        console.error('Error recording property view:', error);
    } else {
        revalidatePath(`/properties/${propertyId}`);
    }
}

// Get analytics summary for a property
export async function getPropertyAnalytics(propertyId: string) {
    try {
        const supabase = await createClient();

        // Use RPC to get counts securely (bypasses RLS SELECT restrictions for aggregates)
        const { data, error } = await supabase.rpc('get_property_analytics_counts', { p_id: propertyId });

        if (error) throw error;

        // Get property created_at for the listed date
        const { data: propData } = await supabase.from('properties').select('created_at').eq('id', propertyId).single();

        const counts = data?.[0] || {
            views_count: 0,
            favorites_count: 0,
            inquiries_count: 0,
            offers_count: 0,
            shares_count: 0
        };

        return {
            views: Number(counts.views_count),
            favorites: Number(counts.favorites_count),
            inquiries: Number(counts.inquiries_count),
            offers: Number(counts.offers_count),
            shares: Number(counts.shares_count),
            createdAt: propData?.created_at || null
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

        if (!error) revalidatePath(`/properties/${propertyId}`);
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
    } else {
        revalidatePath(`/properties/${propertyId}`);
    }
}

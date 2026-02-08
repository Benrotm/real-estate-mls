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
    const supabase = await createClient();

    // Get counts in parallel
    const [viewsResult, favoritesResult, inquiriesResult, offersResult, sharesResult, propertyResult] = await Promise.all([
        supabase.from('property_views').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
        supabase.from('property_favorites').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
        supabase.from('property_inquiries').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
        supabase.from('property_offers').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
        supabase.from('property_shares').select('id', { count: 'exact', head: true }).eq('property_id', propertyId),
        supabase.from('properties').select('created_at').eq('id', propertyId).single()
    ]);

    return {
        views: viewsResult.count || 0,
        favorites: favoritesResult.count || 0,
        inquiries: inquiriesResult.count || 0,
        offers: offersResult.count || 0,
        shares: sharesResult.count || 0,
        createdAt: propertyResult.data?.created_at || null
    };
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

// Submit property offer
export async function submitPropertyOffer(propertyId: string, data: {
    offerAmount: number;
    currency?: string;
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('property_offers').insert({
        property_id: propertyId,
        user_id: user?.id || null,
        offer_amount: data.offerAmount,
        currency: data.currency || 'EUR',
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        message: data.message || null
    });

    if (error) {
        console.error('Error submitting offer:', error);
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

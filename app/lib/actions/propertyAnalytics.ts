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
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Get property owner ID
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();

    if (propError || !property) {
        console.error('Error fetching property owner:', propError);
        return { success: false, error: 'Property not found' };
    }

    let conversationId = null;

    // 2. If user is logged in, create/link chat conversation
    if (user) {
        try {
            const { createAdminClient } = await import('@/app/lib/supabase/admin');
            const supabaseAdmin = createAdminClient();

            // Check if conversation already exists between these two
            const { data: myConvos } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id);

            const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

            let existingConv = null;
            if (myConvoIds.length > 0) {
                const { data: match } = await supabase
                    .from('conversation_participants')
                    .select('conversation_id')
                    .in('conversation_id', myConvoIds)
                    .eq('user_id', property.owner_id)
                    .limit(1)
                    .single();
                existingConv = match;
            }

            if (existingConv) {
                conversationId = existingConv.conversation_id;
            } else {
                // Create new conversation
                const { data: newConv, error: createError } = await supabaseAdmin
                    .from('conversations')
                    .insert({})
                    .select()
                    .single();

                if (newConv) {
                    conversationId = newConv.id;
                    await supabaseAdmin.from('conversation_participants').insert([
                        { conversation_id: conversationId, user_id: user.id },
                        { conversation_id: conversationId, user_id: property.owner_id }
                    ]);
                }
            }

            // 3. Send initial message if conversation exists
            if (conversationId && data.message) {
                await supabaseAdmin.from('messages').insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: `Inquiry regarding property: "${data.message}"`
                });

                // Update conversation updated_at
                await supabaseAdmin.from('conversations').update({ updated_at: new Date() }).eq('id', conversationId);
            }
        } catch (e) {
            console.error('Error setting up chat for inquiry:', e);
            // Don't fail the whole inquiry if chat creation fails
        }
    }

    const { error } = await supabase.from('property_inquiries').insert({
        property_id: propertyId,
        user_id: user?.id || null,
        conversation_id: conversationId,
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

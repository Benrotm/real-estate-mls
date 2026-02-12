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
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Determine if user can see analytics
        let canViewAnalytics = false;

        if (user) {
            // Check if owner
            const { data: property } = await supabase.from('properties').select('owner_id').eq('id', propertyId).single();
            if (property && property.owner_id === user.id) {
                canViewAnalytics = true;
            } else {
                // Check if has "Property Insights" feature
                // We import it dynamically or use the string key to avoid circular deps if any
                const { checkUserFeatureAccess, SYSTEM_FEATURES } = await import('@/app/lib/auth/features');
                canViewAnalytics = await checkUserFeatureAccess(user.id, SYSTEM_FEATURES.PROPERTY_INSIGHTS);
            }
        }

        // 2. Fetch Data
        // If authorized (Owner or Premium Plan), use Admin client to bypass RLS "owner only" policies if necessary.
        // If the RPC `get_property_analytics_counts` is strictly locked to owner in SQL, we must bypass it.
        // Assuming the RPC might check `auth.uid() = owner_id`.

        let counts = {
            views_count: 0,
            favorites_count: 0,
            inquiries_count: 0,
            offers_count: 0,
            shares_count: 0
        };
        let created_at = null;

        if (canViewAnalytics) {
            // Use Admin Client to ensure we get data regardless of RLS
            // (Note: This assumes we want to show stats even to non-owners who paid for the feature)
            const { createAdminClient } = await import('@/app/lib/supabase/admin');
            const supabaseAdmin = createAdminClient();

            // We can't easily call the RPC as admin if the RPC relies on `auth.uid()`. 
            // Instead, we manually aggregate. This is heavier but guaranteed to work.

            const [views, favorites, inquiries, offers, shares, propData] = await Promise.all([
                supabaseAdmin.from('property_views').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
                supabaseAdmin.from('property_favorites').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
                supabaseAdmin.from('property_inquiries').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
                supabaseAdmin.from('property_offers').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
                supabaseAdmin.from('property_shares').select('*', { count: 'exact', head: true }).eq('property_id', propertyId),
                supabaseAdmin.from('properties').select('created_at').eq('id', propertyId).single()
            ]);

            counts = {
                views_count: views.count || 0,
                favorites_count: favorites.count || 0,
                inquiries_count: inquiries.count || 0,
                offers_count: offers.count || 0,
                shares_count: shares.count || 0
            };
            created_at = propData.data?.created_at;

        } else {
            // Not authorized: Return 0s (or public views if we wanted, but requirement says 0)
            // We still fetch created_at for the "Listed" date if that's public info?
            // Usually listed date is public.
            const { data: propData } = await supabase.from('properties').select('created_at').eq('id', propertyId).single();
            created_at = propData?.created_at;
        }

        return {
            views: Number(counts.views_count),
            favorites: Number(counts.favorites_count),
            inquiries: Number(counts.inquiries_count),
            offers: Number(counts.offers_count),
            shares: Number(counts.shares_count),
            createdAt: created_at || null
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

    try {
        // Check if already favorited
        const { data: existing, error: checkError } = await supabase
            .from('property_favorites')
            .select('id')
            .eq('property_id', propertyId)
            .eq('user_id', user.id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) rows returned
            console.error('Error checking favorite status:', checkError);
        }

        if (existing) {
            // Remove favorite
            const { error } = await supabase
                .from('property_favorites')
                .delete()
                .eq('id', existing.id);

            if (error) {
                console.error('Error removing favorite:', error);
                throw error;
            }

            return { success: true, isFavorited: false };
        } else {
            // Add favorite
            const { error } = await supabase.from('property_favorites').insert({
                property_id: propertyId,
                user_id: user.id
            });

            if (error) {
                console.error('Error adding favorite:', error);
                // Check for RLS violation
                if (error.code === '42501') {
                    return { success: false, error: 'Permission denied. Please refresh and try again.' };
                }
                throw error;
            }

            revalidatePath(`/properties/${propertyId}`);
            return { success: true, isFavorited: true };
        }
    } catch (e) {
        console.error('Toggle favorite exception:', e);
        return { success: false, error: 'Failed to update favorite' };
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
        .maybeSingle();

    return !!data;
}

// ... existing code ...

// Get user's favorite properties
export async function getUserFavorites() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    try {
        const { data: favorites, error } = await supabase
            .from('property_favorites')
            .select(`
                property_id,
                properties:properties (*)
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching favorites raw:', error);
            throw error;
        }

        // Transform data to match Property interface
        return favorites
            .filter((fav: any) => fav.properties) // Filter out null properties (deleted or RLS hidden)
            .map((fav: any) => fav.properties);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
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

    if (!user) {
        return { success: false, error: 'You must be logged in to submit an inquiry.' };
    }

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

    // Server-Side Deduplication: Check for identical inquiry in last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    let duplicateQuery = supabase
        .from('property_inquiries')
        .select('id')
        .eq('property_id', propertyId)
        .gte('created_at', oneMinuteAgo)
        .eq('message', data.message || ''); // Also match message to be sure it's same intent

    if (user) {
        duplicateQuery = duplicateQuery.eq('user_id', user.id);
    } else {
        duplicateQuery = duplicateQuery.eq('email', data.email);
    }

    const { data: existingInquiry } = await duplicateQuery.maybeSingle();

    if (existingInquiry) {
        return { success: true };
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

    // 4. Auto-Create Lead for the Owner
    try {
        const { createAdminClient } = await import('@/app/lib/supabase/admin');
        const supabaseAdmin = createAdminClient();

        // Check if lead already exists for this agent with this email
        const { data: existingLead } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('agent_id', property.owner_id)
            .eq('email', data.email)
            .limit(1)
            .maybeSingle();

        if (!existingLead) {
            const { data: newLead, error: leadError } = await supabaseAdmin
                .from('leads')
                .insert({
                    agent_id: property.owner_id,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null,
                    status: 'New',
                    source: 'Property Inquiry',
                    notes: `Auto-generated from inquiry on property: ${propertyId}\nMessage: ${data.message || 'No message'}`,
                    created_by: property.owner_id // Set creator as owner to maintain RLS consistency if viewing as agent
                })
                .select()
                .single();

            if (leadError) {
                console.error('Error auto-creating lead:', leadError);
            } else if (newLead) {
                // Log activity
                await supabaseAdmin.from('lead_activities').insert({
                    lead_id: newLead.id,
                    type: 'inquiry',
                    description: `New property inquiry received: "${data.message?.substring(0, 50)}${data.message && data.message.length > 50 ? '...' : ''}"`,
                    created_by: property.owner_id
                });
            }
        } else {
            // Optional: Update existing lead or log activity on it
            await supabaseAdmin.from('lead_activities').insert({
                lead_id: existingLead.id,
                type: 'inquiry',
                description: `New inquiry on property ${propertyId}: "${data.message?.substring(0, 50)}..."`,
                created_by: property.owner_id
            });
        }

    } catch (leadAutoError) {
        console.error('Failed to auto-process lead from inquiry:', leadAutoError);
        // Do not fail the inquiry submission itself
    }

    revalidatePath('/dashboard/owner/leads');
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



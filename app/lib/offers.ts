'use server';

import { createClient } from './supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitOffer(propertyId: string, amount: number) {
    const supabase = await createClient();

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('You must be logged in to make an offer.');
        }

        // Get user profile for name/email
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', user.id)
            .single();

        // Server-Side Deduplication: Check for identical offer in last minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: existingOffer } = await supabase
            .from('property_offers')
            .select('id')
            .eq('property_id', propertyId)
            .eq('user_id', user.id)
            .eq('offer_amount', amount)
            .gte('created_at', oneMinuteAgo)
            .single();

        if (existingOffer) {
            // Idempotent success: If it already exists, just return success
            return { success: true };
        }

        const { error } = await supabase
            .from('property_offers')
            .insert([
                {
                    property_id: propertyId,
                    user_id: user.id,
                    offer_amount: amount,
                    currency: 'EUR',
                    name: profile?.full_name || null,
                    email: profile?.email || user.email || null,
                    phone: profile?.phone || null,
                    status: 'pending'
                }
            ]);

        if (error) throw error;

        revalidatePath(`/properties/${propertyId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Submit offer error:', error);
        return { success: false, error: error.message };
    }
}

export async function getOfferCount(propertyId: string) {
    const supabase = await createClient();

    try {
        const { count, error } = await supabase
            .from('property_offers')
            .select('*', { count: 'exact', head: true })
            .eq('property_id', propertyId);

        if (error) throw error;

        return count || 0;
    } catch (error) {
        console.error('Get offer count error:', error);
        return 0;
    }
}


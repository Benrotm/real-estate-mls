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

        // Auto-Create Lead for the Owner
        try {
            const { createAdminClient } = await import('./supabase/admin');
            const supabaseAdmin = createAdminClient();

            // Fetch property owner_id if we don't have it (we only had property_id)
            const { data: propertyData } = await supabaseAdmin
                .from('properties')
                .select('owner_id')
                .eq('id', propertyId)
                .single();

            if (propertyData && propertyData.owner_id) {
                // Check if lead already exists
                const { data: existingLead } = await supabaseAdmin
                    .from('leads')
                    .select('id')
                    .eq('agent_id', propertyData.owner_id)
                    // We try to match by email if available, otherwise name (weak match but better than nothing for offers which requires auth)
                    // Offers require auth, so we definitely have user.id and profile email from lines 17-21 above
                    .eq('email', profile?.email || user.email)
                    .limit(1)
                    .maybeSingle();

                if (!existingLead) {
                    const { data: newLead, error: leadError } = await supabaseAdmin
                        .from('leads')
                        .insert({
                            agent_id: propertyData.owner_id,
                            name: profile?.full_name || 'Anonymous User',
                            email: profile?.email || user.email,
                            phone: profile?.phone || null,
                            status: 'new', // Lowercase to match DB constraint
                            source: 'Property Offer',
                            notes: `Auto-generated from offer of ${amount} EUR on property ID: ${propertyId}`,
                            created_by: propertyData.owner_id
                        })
                        .select()
                        .single();

                    if (leadError) {
                        console.error('Error auto-creating lead from offer:', leadError);
                    } else if (newLead) {
                        await supabaseAdmin.from('lead_activities').insert({
                            lead_id: newLead.id,
                            type: 'offer',
                            description: `Submitted an offer of ${amount} EUR`,
                            created_by: propertyData.owner_id
                        });
                    }
                } else {
                    // Update existing lead activity
                    await supabaseAdmin.from('lead_activities').insert({
                        lead_id: existingLead.id,
                        type: 'offer',
                        description: `Submitted a new offer of ${amount} EUR`,
                        created_by: propertyData.owner_id
                    });
                }
            }
        } catch (leadError) {
            console.error('Error in auto-lead creation from offer:', leadError);
            // Don't block the offer submission
        }

        revalidatePath(`/properties/${propertyId}`);
        revalidatePath('/dashboard/owner/leads');
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


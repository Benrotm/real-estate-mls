'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface SavedSearch {
    id: string;
    name: string;
    query_params: any;
    created_at: string;
    last_run_at: string;
}

export async function saveSearch(name: string, queryParams: any) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: 'You must be logged in to save searches.' };
    }

    try {
        // 1. Insert saved search
        const { error } = await supabase
            .from('saved_searches')
            .insert({
                user_id: user.id,
                name,
                query_params: queryParams,
                last_run_at: new Date().toISOString()
            });

        if (error) throw error;

        // 2. Fetch profile info
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', user.id)
            .single();

        // 3. Find default agent (first super_admin/admin)
        const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin'])
            .limit(1);
        const adminId = admins && admins.length > 0 ? admins[0].id : user.id;

        // 4. Check if lead already exists for this email
        const { data: existingLeads } = await supabase
            .from('leads')
            .select('id')
            .eq('email', user.email)
            .limit(1);

        const leadData = {
            agent_id: adminId,
            name: profile?.full_name || user.email?.split('@')[0] || 'Client',
            email: user.email,
            phone: profile?.phone || null,
            status: 'new',
            source: 'Saved Search',
            preference_type: queryParams.type || null,
            preference_listing_type: queryParams.listing_type || null,
            preference_location_city: queryParams.location_city || null,
            preference_location_area: queryParams.location_area || null,
            budget_min: queryParams.minPrice ? Number(queryParams.minPrice) : null,
            budget_max: queryParams.maxPrice ? Number(queryParams.maxPrice) : null,
            preference_rooms_min: queryParams.rooms ? Number(queryParams.rooms) : null,
            preference_surface_min: queryParams.area ? Number(queryParams.area) : null,
            preference_location_polygon: queryParams.location_polygon || null,
            preference_features: queryParams.features || []
        };

        if (existingLeads && existingLeads.length > 0) {
            // Update existing lead
            await supabase
                .from('leads')
                .update(leadData)
                .eq('id', existingLeads[0].id);
        } else {
            // Create new lead
            await supabase
                .from('leads')
                .insert(leadData);
        }

        // 5. Send notification to all admins/superadmins
        const { data: allAdmins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        if (allAdmins) {
            const adminClient = createAdminClient();
            for (const admin of allAdmins) {
                await adminClient.from('notifications').insert({
                    user_id: admin.id,
                    type: 'lead',
                    title: 'Saved Search & Lead Nou',
                    content: `Clientul ${profile?.full_name || user.email} a salvat o căutare și a fost generat un lead nou.`,
                    link: `/dashboard/admin/leads`
                });
            }
        }

        revalidatePath('/dashboard/client/searches');
        revalidatePath('/dashboard/admin/leads');
        return { success: true };
    } catch (error: any) {
        console.error('Error saving search:', error);
        return { success: false, error: error.message || 'Failed to save search' };
    }
}

export async function getSavedSearches(): Promise<{ success: boolean, data?: SavedSearch[], error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated', data: [] };

    try {
        const { data, error } = await supabase
            .from('saved_searches')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data as SavedSearch[] };
    } catch (error: any) {
        console.error('Error fetching saved searches:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteSavedSearch(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        const { error } = await supabase
            .from('saved_searches')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id); // Security: Ensure user owns it

        if (error) throw error;

        revalidatePath('/dashboard/client/searches');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting saved search:', error);
        return { success: false, error: error.message };
    }
}

export async function updateSavedSearch(id: string, name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    try {
        const { error } = await supabase
            .from('saved_searches')
            .update({ name })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        revalidatePath('/dashboard/client/searches');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating saved search:', error);
        return { success: false, error: error.message };
    }
}

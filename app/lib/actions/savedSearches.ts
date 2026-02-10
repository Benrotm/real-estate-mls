'use server';

import { createClient } from '@/app/lib/supabase/server';
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
        const { error } = await supabase
            .from('saved_searches')
            .insert({
                user_id: user.id,
                name,
                query_params: queryParams,
                last_run_at: new Date().toISOString()
            });

        if (error) throw error;

        revalidatePath('/dashboard/client/searches');
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

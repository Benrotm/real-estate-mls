'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getMarketingPage(pageKey: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('marketing_pages')
            .select('*')
            .eq('page_key', pageKey)
            .maybeSingle();

        if (error) throw error;
        return { success: true, page: data };
    } catch (error: any) {
        console.error(`Error fetching marketing page ${pageKey}:`, error);
        return { success: false, error: error.message || 'Failed to fetch marketing page' };
    }
}

export async function saveMarketingPage(pageKey: string, title: string, subtitle: string, sections: any[]) {
    try {
        const supabase = await createClient();
        
        // 1. Verify user profile permission role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Unauthorized. Authenticated session required.' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
            return { success: false, error: 'Unauthorized. Admin permissions required.' };
        }

        const adminClient = createAdminClient();

        // 2. Perform upsert
        const { data, error } = await adminClient
            .from('marketing_pages')
            .upsert({
                page_key: pageKey,
                title,
                subtitle,
                sections,
                updated_at: new Date().toISOString()
            }, { onConflict: 'page_key' })
            .select()
            .single();

        if (error) throw error;

        revalidatePath(`/for-${pageKey}`);
        revalidatePath(`/dashboard/admin/marketing-pages`);
        
        return { success: true, page: data };
    } catch (error: any) {
        console.error(`Error saving marketing page ${pageKey}:`, error);
        return { success: false, error: error.message || 'Failed to save marketing page' };
    }
}

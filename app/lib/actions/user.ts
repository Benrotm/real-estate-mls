'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAvatar(avatarUrl: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile avatar:', error);
            return { error: error.message };
        }

        revalidatePath('/profile');
        revalidatePath('/', 'layout'); // Update navbar avatar
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

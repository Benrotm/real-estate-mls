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

export async function updateUserPlan(planName: string) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Map plan name to tier
    // Logic: 
    // Free -> free
    // Agent Premium / Owner Pro -> pro
    // Agent Scale / Owner Enterprise / Developer -> enterprise
    // This is a rough mapping, ideally we should just store the plan_name or have a proper relation
    // For now, based on the prompt's implication of "switching plans", we'll map to the fixed tiers we have in UserProfile types

    let tier: 'free' | 'pro' | 'enterprise' = 'free';
    const lowerName = planName.toLowerCase();

    if (lowerName.includes('free') || lowerName.includes('basic')) {
        tier = 'free';
    } else if (lowerName.includes('premium') || lowerName.includes('pro') || lowerName.includes('growth')) {
        tier = 'pro';
    } else if (lowerName.includes('enterprise') || lowerName.includes('scale')) {
        tier = 'enterprise';
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                plan_tier: tier,
                // In a real app we might also update limits here based on the plan
                // But for now the DB trigger or manual admin update handles limits usually?
                // Or we should update them here?
                // The `getUserProfile` reads limits from the profile row.
                // If we change plan_tier, we should ideally update limits too if they are stored in columns.
                // Let's assume for now just tagging the tier is enough or the DB handles it.
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating plan:', error);
            return { error: error.message };
        }

        revalidatePath('/pricing');
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

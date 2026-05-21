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
    } else if (lowerName.includes('premium') || lowerName.includes('pro') || lowerName.includes('growth') || lowerName.includes('pro real')) {
        tier = 'pro';
    } else if (lowerName.includes('enterprise') || lowerName.includes('scale') || lowerName.includes('full house agency') || lowerName.includes('ultra plan')) {
        tier = 'enterprise';
    }

    try {
        // Fetch the actual plan details from DB to get real limits
        const { data: planData } = await supabase
            .from('plans')
            .select('*')
            .eq('name', planName)
            .single();

        const updateData: any = { plan_tier: tier };
        
        if (planData) {
            if (planData.listings_limit !== undefined) updateData.listings_limit = planData.listings_limit;
            if (planData.featured_limit !== undefined) updateData.featured_limit = planData.featured_limit;
        } else {
            // Hardcode fallbacks if not found (just in case)
            if (tier === 'enterprise') { updateData.listings_limit = 500; updateData.featured_limit = 250; }
            else if (tier === 'pro') { updateData.listings_limit = 50; updateData.featured_limit = 20; }
            else { updateData.listings_limit = 100; updateData.featured_limit = 9; }
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
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

export async function updateUserProfile(data: {
    full_name: string;
    phone: string;
    cnp?: string;
    id_series_number?: string;
    id_photo_url?: string;
    is_company?: boolean;
    company_name?: string;
    company_cui?: string;
    company_reg_com?: string;
    company_address?: string;
}) {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: data.full_name,
                phone: data.phone,
                cnp: data.cnp,
                id_series_number: data.id_series_number,
                id_photo_url: data.id_photo_url,
                is_company: data.is_company,
                company_name: data.company_name,
                company_cui: data.company_cui,
                company_reg_com: data.company_reg_com,
                company_address: data.company_address
            })
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', error);
            return { error: error.message };
        }

        revalidatePath('/profile');
        revalidatePath('/', 'layout'); // Update navbar name
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getCurrentProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return { error: error.message };
    return { profile };
}


'use server';

import { createClient } from '../supabase/server';

export async function getUserCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
    if (error) return { error: error.message };
    return { credits: data.credits as number };
}

export async function deductUserCredits(amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get current balance
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
    if (readError) return { error: readError.message };
    
    if ((profile.credits || 0) < amount) {
        return { error: 'Fonduri insuficiente', insufficient: true };
    }

    const newBalance = (profile.credits || 0) - amount;
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', user.id);

    if (updateError) return { error: updateError.message };
    return { success: true, remaining: newBalance };
}

export async function grantUserCredits(userId: string, amount: number) {
    const supabase = await createClient();
    
    // Verify admin calling the function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Insufficient permissions' };
    }

    // Get user's current
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
        
    if (readError) return { error: readError.message };

    const newBalance = (profile.credits || 0) + amount;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

    if (updateError) return { error: updateError.message };
    return { success: true, newBalance };
}

export async function updateSystemFeatureDeduction(featureId: string) {
    // Utility for generic features wanting to pull out their cost dynamically and consume it.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch the specific cost of this feature from settings
    const { data: costData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();
    
    const costsMap = (costData?.setting_value as Record<string, number>) || {};
    const cost = costsMap[featureId] || 0; // Default to 0 if not set

    if (cost === 0) return { success: true, deducted: 0, error: undefined };

    return await deductUserCredits(cost);
}

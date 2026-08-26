'use server';

import { createClient } from '../supabase/server';

export async function getFeatureCosts() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();
        
    if (error) return { error: error.message };
    return { costs: data.setting_value as Record<string, number> };
}

export async function getAIKeys() {
    const supabase = await createClient();
    
    // Only return keys if the requesting user is an admin/super_admin
    // (Regular users should never see the keys, even if RLS somehow allowed it)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return { error: 'Insufficient permissions to read API keys' };
    }

    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_api_keys')
        .single();

    if (error) return { error: error.message };
    return { keys: data.setting_value as Record<string, string> };
}

export async function updateFeatureCosts(costsMap: Record<string, number>) {
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('platform_settings')
        .update({ setting_value: costsMap })
        .eq('setting_key', 'feature_costs');

    // Due to RLS, if they aren't admin, it fails silently or returns an error.
    if (error) return { error: error.message };
    return { success: true };
}

export async function updateAIProviderKeys(keysMap: Record<string, string>) {
    const supabase = await createClient();
    
    const { data } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_api_keys')
        .maybeSingle();

    const existing = (data?.setting_value as Record<string, string>) || {};
    const merged = { ...existing, ...keysMap };

    const { error } = await supabase
        .from('platform_settings')
        .upsert({
            setting_key: 'ai_api_keys',
            setting_value: merged
        });

    if (error) return { error: error.message };
    return { success: true };
}

export async function saveSingleAIKey(keyName: string, keyValue: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'ai_api_keys')
            .maybeSingle();

        const existing = (data?.setting_value as Record<string, string>) || {};
        existing[keyName] = keyValue;

        const { error } = await supabase
            .from('platform_settings')
            .upsert({
                setting_key: 'ai_api_keys',
                setting_value: existing
            });

        if (error) return { error: error.message };
        return { success: true };
    } catch (e: any) {
        return { error: e.message || 'Server error' };
    }
}

export async function getSocialLinks() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'social_media_links')
        .maybeSingle();
        
    if (error) return { error: error.message };
    if (!data) return { links: {} as Record<string, string[]> };
    return { links: data.setting_value as Record<string, string[]> };
}

export async function updateSocialLinks(linksMap: Record<string, string[]>) {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return { error: 'Insufficient permissions' };
    }

    const { error } = await supabase
        .from('platform_settings')
        .upsert({ 
            setting_key: 'social_media_links', 
            setting_value: linksMap 
        }, { onConflict: 'setting_key' });

    if (error) return { error: error.message };
    return { success: true };
}


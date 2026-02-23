'use server';

import { createClient } from '@supabase/supabase-js';

// We create a helper to read/write settings. 
// Note: Since we could not apply the DB migration automatically through scripts (due to Supabase pooler restrictions),
// we will degrade gracefully by assuming true if the table doesn't exist yet, but providing a script for the user to run.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AdminSettings {
    require_ownership_verification: boolean;
    enable_anti_duplicate_intelligence: boolean;
}

const DEFAULT_SETTINGS = {
    require_ownership_verification: true,
    enable_anti_duplicate_intelligence: true
};

export async function getAdminSettings(): Promise<AdminSettings> {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('key, value');

        if (error || !data) {
            console.log("admin_settings table likely missing, using defaults", error?.message);
            return DEFAULT_SETTINGS;
        }

        const settings: any = { ...DEFAULT_SETTINGS };
        for (const row of data) {
            if (row.value === 'true' || row.value === true) settings[row.key] = true;
            if (row.value === 'false' || row.value === false) settings[row.key] = false;
        }

        return settings;
    } catch (err) {
        return DEFAULT_SETTINGS;
    }
}

export async function updateAdminSetting(key: string, value: boolean) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key,
                value: value.toString(),
                description: key === 'require_ownership_verification'
                    ? 'Require owners to verify via SMS or Email when importing a listing'
                    : 'Enable address and feature hashing to prevent duplicate imports'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update setting:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

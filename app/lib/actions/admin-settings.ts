'use server';

import { createClient } from '@supabase/supabase-js';

// We create a helper to read/write settings. 
// Note: Since we could not apply the DB migration automatically through scripts (due to Supabase pooler restrictions),
// we will degrade gracefully by assuming true if the table doesn't exist yet, but providing a script for the user to run.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ImmofluxConfig {
    is_active: boolean;
    last_scraped_id: number;
    scrape_limit: number;
    region_filter: string;
    url: string;
    username?: string;
    password?: string;
    mapping: {
        title: string;
        price: string;
        description: string;
        location_city: string;
        rooms: string;
        phone: string;
    }
}

export interface AdminSettings {
    require_ownership_verification: boolean;
    enable_anti_duplicate_intelligence: boolean;
    immoflux_integration?: ImmofluxConfig;
}

const DEFAULT_SETTINGS: AdminSettings = {
    require_ownership_verification: true,
    enable_anti_duplicate_intelligence: true,
    immoflux_integration: {
        is_active: false,
        last_scraped_id: 0,
        scrape_limit: 50,
        region_filter: "Timis",
        url: "https://blitz.immoflux.ro/approperties",
        username: "",
        password: "",
        mapping: {
            title: "td:nth-child(4) span.tablesaw-cell-content",
            price: "td:nth-child(3) span.blue-600 strong",
            description: "td:nth-child(4) div.text-table-expandable",
            location_city: "td:nth-child(4) strong",
            rooms: "td:nth-child(4) span.label",
            phone: "td:nth-child(4) div.btn-primary"
        }
    }
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
            if (row.key === 'immoflux_integration') {
                settings[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            } else {
                if (row.value === 'true' || row.value === true) settings[row.key] = true;
                if (row.value === 'false' || row.value === false) settings[row.key] = false;
            }
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

export async function updateImmofluxSetting(config: ImmofluxConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'immoflux_integration',
                value: config,
                description: 'Configuration and mapping rules for the Immoflux property scraper'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update Immoflux details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

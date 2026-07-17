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
    city_filter?: string;
    property_type_filter?: string;
    transaction_type_filter?: string;
    url: string;
    username?: string;
    password?: string;
    delay_min: number;    // Min seconds between property fetches (anti-ban)
    delay_max: number;    // Max seconds between property fetches (anti-ban)
    auto_interval: number; // Minutes between auto-scrape batches
    watcher_interval_hours: number; // Hours between watcher checks
    mapping: {
        title: string;
        price: string;
        description: string;
        location_city: string;
        rooms: string;
        owner_phone: string;
    }
}

export interface SoldImmofluxConfig {
    is_active: boolean;
    last_scraped_id: number;
    scrape_limit: number;
    region_filter: string;
    city_filter?: string;
    zone_filter?: string;
    stadiu_filter: string[];
    url: string;
    username?: string;
    password?: string;
    delay_min: number;
    delay_max: number;
    auto_interval: number;
    watcher_interval_hours: number;
    mapping: Record<string, string>;
}

export interface OlxConfig {
    is_active: boolean;
    category_url: string;
    last_scraped_id: number;
    delay_min: number;
    delay_max: number;
    auto_interval: number;
    watcher_interval_hours: number;
}

export interface ProxyConfig {
    is_active: boolean;
    host: string;
    port: string;
    username?: string;
    password?: string;
}

export interface GlobalWatermarkConfig {
    is_active: boolean;
    override_users: boolean;
    logo_url: string;
    opacity: number;      // 0.1 to 1.0
    size: number;         // 10 to 50
    position: string;     // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'
}

export interface AdminSettings {
    require_ownership_verification: boolean;
    enable_anti_duplicate_intelligence: boolean;
    properties_page_public?: boolean;
    registration_open?: boolean;
    immoflux_integration?: ImmofluxConfig;
    fluxmls_integration?: ImmofluxConfig;
    sold_immoflux_integration?: SoldImmofluxConfig;
    olx_integration?: OlxConfig;
    proxy_integration?: ProxyConfig;
    global_watermark?: GlobalWatermarkConfig;
}

const DEFAULT_SETTINGS: AdminSettings = {
    require_ownership_verification: true,
    enable_anti_duplicate_intelligence: true,
    properties_page_public: true,
    registration_open: true,
    olx_integration: {
        is_active: false,
        category_url: "https://www.olx.ro/imobiliare/apartamente-garsoniere-de-vanzare/timisoara/",
        last_scraped_id: 1,
        delay_min: 5,
        delay_max: 15,
        auto_interval: 15,
        watcher_interval_hours: 2,
    },
    immoflux_integration: {
        is_active: false,
        last_scraped_id: 1,
        scrape_limit: 50,
        region_filter: "Timis",
        city_filter: "Timisoara",
        property_type_filter: "",
        transaction_type_filter: "",
        url: "https://blitz.immoflux.ro/approperties",
        username: "",
        password: "",
        delay_min: 3,
        delay_max: 8,
        auto_interval: 10,
        watcher_interval_hours: 2,
        mapping: {
            title: "td:nth-child(4) span.tablesaw-cell-content",
            price: "td:nth-child(3) span.blue-600 strong",
            description: "td:nth-child(4) div.text-table-expandable",
            location_city: "td:nth-child(4) strong",
            rooms: "td:nth-child(4) span.label",
            owner_phone: "td:nth-child(4) div.btn-primary"
        }
    },
    sold_immoflux_integration: {
        is_active: false,
        last_scraped_id: 1,
        scrape_limit: 50,
        region_filter: "Timis",
        city_filter: "",
        zone_filter: "",
        stadiu_filter: ["Pierduta - Lost", "Tranzactionata - Won"],
        url: "https://blitz.immoflux.ro/properties",
        username: "benoni.silion@blitz-timisoara.ro",
        password: "",
        delay_min: 3,
        delay_max: 8,
        auto_interval: 10,
        watcher_interval_hours: 2,
        mapping: {
            title: "h2.modal-title",
            price: "Pret:",
            sold_price: "Pret tranzactionare:",
            days_on_market: "Zile in piata:",
            status: "Stadiu:",
            listing_type: "Tranzactie:",
            property_type: "Tip:",
            zone: "Zona:",
            address: "Adresa:",
            characteristics: "Caracteristici",
            areas: "Suprafete",
            building: "Cladire",
            description: "Descriere"
        }
    },
    fluxmls_integration: {
        is_active: false,
        last_scraped_id: 1,
        scrape_limit: 50,
        region_filter: "Timis",
        city_filter: "",
        property_type_filter: "",
        transaction_type_filter: "",
        url: "https://fluxmls.immoflux.ro/login",
        username: "alexandru.nanu@remax.ro",
        password: "",
        delay_min: 3,
        delay_max: 8,
        auto_interval: 10,
        watcher_interval_hours: 2,
        mapping: {
            title: "td:nth-child(4) span.tablesaw-cell-content",
            price: "td:nth-child(3) span.blue-600 strong",
            description: "td:nth-child(4) div.text-table-expandable",
            location_city: "td:nth-child(4) strong",
            rooms: "td:nth-child(4) span.label",
            owner_phone: "td:nth-child(4) div.btn-primary"
        }
    },
    proxy_integration: {
        is_active: false,
        host: "brd.superproxy.io",
        port: "22225"
    },
    global_watermark: {
        is_active: false,
        override_users: false,
        logo_url: "",
        opacity: 0.5,
        size: 20,
        position: "bottom-right"
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
            if (row.key === 'immoflux_integration' || row.key === 'sold_immoflux_integration' || row.key === 'fluxmls_integration' || row.key === 'olx_integration' || row.key === 'proxy_integration' || row.key === 'global_watermark') {
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

export async function createScrapeJob(config: { url: string; delay_ms: number; pages: number }) {
    try {
        const { data, error } = await supabase
            .from('scrape_jobs')
            .insert({
                category_url: config.url,
                status: 'running',
                pages_to_scrape: config.pages,
                delay_ms: config.delay_ms
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create scrape job:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateAdminSetting(key: string, value: boolean) {
    try {
        let description = '';
        if (key === 'require_ownership_verification') {
            description = 'Require owners to verify via SMS or Email when importing a listing';
        } else if (key === 'enable_anti_duplicate_intelligence') {
            description = 'Enable address and feature hashing to prevent duplicate imports';
        } else if (key === 'properties_page_public') {
            description = 'Toggle if properties catalog and detail views are public or registered users only';
        } else if (key === 'registration_open') {
            description = 'Toggle if registration is open to everyone or requires admin approval before login';
        }

        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key,
                value: value.toString(),
                description
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

export async function updateSoldImmofluxSetting(config: SoldImmofluxConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'sold_immoflux_integration',
                value: config,
                description: 'Configuration and mapping rules for the Sold Immoflux properties scraper'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update Sold Immoflux details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateFluxMLSSetting(config: ImmofluxConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'fluxmls_integration',
                value: config,
                description: 'Configuration and mapping rules for the FluxMLS API integration'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update FluxMLS details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateOlxSetting(config: OlxConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'olx_integration',
                value: config,
                description: 'Configuration for the OLX/Publi24 property scraper microservice'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update OLX details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateProxySetting(config: ProxyConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'proxy_integration',
                value: config,
                description: 'Residential Proxy API settings to bypass scraping bot protections'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update Proxy details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function updateGlobalWatermarkSetting(config: GlobalWatermarkConfig) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'global_watermark',
                value: config,
                description: 'Global watermark overlay configuration and settings override'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update Global Watermark details:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getMenuOrderings(): Promise<Record<string, string[]>> {
    try {
        const roles = ['admin', 'agent', 'owner', 'developer', 'client'];
        const keys = roles.map(r => `menu_order_${r}`);

        const { data, error } = await supabase
            .from('admin_settings')
            .select('key, value')
            .in('key', keys);

        const orderings: Record<string, string[]> = {};
        
        for (const role of roles) {
            orderings[role] = [];
        }

        if (error || !data) {
            return orderings;
        }

        for (const row of data) {
            const role = row.key.replace('menu_order_', '');
            try {
                orderings[role] = typeof row.value === 'string' ? JSON.parse(row.value) : (row.value || []);
            } catch {
                orderings[role] = [];
            }
        }

        return orderings;
    } catch (err) {
        console.error("Failed to load menu orderings:", err);
        return {};
    }
}

export async function saveMenuOrdering(role: string, order: string[]) {
    try {
        const key = `menu_order_${role}`;
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key,
                value: order,
                description: `Custom navigation menu ordering configuration for the ${role} role`
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update menu ordering:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getMenuVisibilitySettings(): Promise<Record<string, string[]>> {
    try {
        const roles = ['admin', 'agent', 'owner', 'developer', 'client'];
        const keys = roles.map(r => `menu_disabled_${r}`);

        const { data, error } = await supabase
            .from('admin_settings')
            .select('key, value')
            .in('key', keys);

        const disabledItems: Record<string, string[]> = {};
        
        for (const role of roles) {
            disabledItems[role] = [];
        }

        if (error || !data) {
            return disabledItems;
        }

        for (const row of data) {
            const role = row.key.replace('menu_disabled_', '');
            try {
                disabledItems[role] = typeof row.value === 'string' ? JSON.parse(row.value) : (row.value || []);
            } catch {
                disabledItems[role] = [];
            }
        }

        return disabledItems;
    } catch (err) {
        console.error("Failed to load menu visibility settings:", err);
        return {};
    }
}

export async function saveMenuVisibility(role: string, disabledItems: string[]) {
    try {
        const key = `menu_disabled_${role}`;
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key,
                value: disabledItems,
                description: `Custom navigation menu disabled/hidden items list configuration for the ${role} role`
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update menu visibility:", error.message);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

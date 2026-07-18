'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
    };
    continuous_loop?: boolean;
    continuous_page_delay?: number;
    continuous_max_pages?: number;
    admin_notes?: string;
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
    admin_notes?: string;
}

export interface Publi24Config {
    is_active: boolean;
    category_url: string;
    last_scraped_id: number;
    delay_min: number;
    delay_max: number;
    auto_interval: number;
    watcher_interval_hours: number;
    admin_notes?: string;
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
    publi24_integration?: Publi24Config;
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
        delay_min: 3,
        delay_max: 8,
        auto_interval: 10,
        watcher_interval_hours: 2,
    },
    publi24_integration: {
        is_active: false,
        category_url: "https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/timis/timisoara/",
        last_scraped_id: 1,
        delay_min: 3,
        delay_max: 8,
        auto_interval: 10,
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
        },
        continuous_loop: false,
        continuous_page_delay: 30,
        continuous_max_pages: 0
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
            if (row.key === 'immoflux_integration' || row.key === 'sold_immoflux_integration' || row.key === 'fluxmls_integration' || row.key === 'olx_integration' || row.key === 'publi24_integration' || row.key === 'proxy_integration' || row.key === 'global_watermark') {
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
                description: 'Configuration for the OLX property scraper microservice'
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

export async function updatePubli24Setting(config: Publi24Config) {
    try {
        const { error } = await supabase
            .from('admin_settings')
            .upsert({
                key: 'publi24_integration',
                value: config,
                description: 'Configuration for the Publi24 property scraper microservice'
            }, { onConflict: 'key' });

        if (error) {
            console.error("Failed to update Publi24 details:", error.message);
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

export async function getSystemLocations() {
    try {
        const { data, error } = await supabase
            .from('system_locations')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        
        const countries = data.filter((x: any) => x.type === 'country').map((x: any) => ({
            id: x.id,
            name: x.name,
            latitude: x.latitude,
            longitude: x.longitude
        }));
        const counties = data.filter((x: any) => x.type === 'county').map((x: any) => ({
            id: x.id,
            name: x.name,
            parent_id: x.parent_id,
            latitude: x.latitude,
            longitude: x.longitude
        }));
        const cities = data.filter((x: any) => x.type === 'city').map((x: any) => ({
            id: x.id,
            name: x.name,
            parent_id: x.parent_id,
            latitude: x.latitude,
            longitude: x.longitude
        }));
        const areas = data.filter((x: any) => x.type === 'area').map((x: any) => ({
            id: x.id,
            name: x.name,
            parent_id: x.parent_id,
            latitude: x.latitude,
            longitude: x.longitude
        }));

        return { countries, counties, cities, areas };
    } catch (err: any) {
        console.error("Failed to load system locations:", err);
        return { countries: [], counties: [], cities: [], areas: [] };
    }
}

export async function addSystemLocation(
    type: 'country' | 'county' | 'city' | 'area', 
    name: string,
    parentId?: string | null,
    latitude?: number | null,
    longitude?: number | null
) {
    try {
        const client = await createServerClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify if super_admin
        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { success: false, error: 'Access denied: Super Admin only' };
        }

        const { data, error } = await supabase
            .from('system_locations')
            .insert({ 
                type, 
                name: name.trim(),
                parent_id: parentId || null,
                latitude: latitude || null,
                longitude: longitude || null
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/dashboard/admin/settings/locations');
        return { success: true, data };
    } catch (err: any) {
        console.error("Failed to add system location:", err);
        return { success: false, error: err.message || 'Failed to save location' };
    }
}

export async function updateSystemLocation(
    id: string,
    updates: {
        name?: string;
        parent_id?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    }
) {
    try {
        const client = await createServerClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify if super_admin
        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { success: false, error: 'Access denied: Super Admin only' };
        }

        const { data, error } = await supabase
            .from('system_locations')
            .update({
                name: updates.name !== undefined ? updates.name.trim() : undefined,
                parent_id: updates.parent_id !== undefined ? updates.parent_id : undefined,
                latitude: updates.latitude !== undefined ? updates.latitude : undefined,
                longitude: updates.longitude !== undefined ? updates.longitude : undefined
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/dashboard/admin/settings/locations');
        return { success: true, data };
    } catch (err: any) {
        console.error("Failed to update system location:", err);
        return { success: false, error: err.message || 'Failed to update location' };
    }
}

export async function deleteSystemLocation(id: string) {
    try {
        const client = await createServerClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify if super_admin
        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { success: false, error: 'Access denied: Super Admin only' };
        }

        const { error } = await supabase
            .from('system_locations')
            .delete()
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/dashboard/admin/settings/locations');
        return { success: true };
    } catch (err: any) {
        console.error("Failed to delete system location:", err);
        return { success: false, error: err.message || 'Failed to delete location' };
    }
}

export async function batchAddSystemLocations(
    items: {
        type: 'country' | 'county' | 'city' | 'area';
        name: string;
        parent_id?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    }[]
) {
    try {
        const client = await createServerClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify if super_admin
        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { success: false, error: 'Access denied: Super Admin only' };
        }

        const insertPayload = items.map(item => ({
            type: item.type,
            name: item.name.trim(),
            parent_id: item.parent_id || null,
            latitude: item.latitude || null,
            longitude: item.longitude || null
        }));

        const { data, error } = await supabase
            .from('system_locations')
            .insert(insertPayload)
            .select();

        if (error) throw error;

        revalidatePath('/dashboard/admin/settings/locations');
        return { success: true, data };
    } catch (err: any) {
        console.error("Failed to batch add system locations:", err);
        return { success: false, error: err.message || 'Failed to save locations' };
    }
}

export async function importRomaniaLocations() {
    try {
        const client = await createServerClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify if super_admin
        const { data: profile } = await client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return { success: false, error: 'Access denied: Super Admin only' };
        }

        // 1. Fetch Romania localitati JSON
        const response = await fetch('https://raw.githubusercontent.com/catalin87/baza-de-date-localitati-romania/master/date/localitati.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch Romania dataset: ${response.statusText}`);
        }
        const dataset: any[] = await response.json();

        // 2. Load existing locations
        const { data: existing, error: errFetch } = await supabase
            .from('system_locations')
            .select('id, name, type, parent_id');
        if (errFetch) throw errFetch;

        const existingMap = new Map<string, string>(); // key: "type:name:parentId", value: id
        existing.forEach((item: any) => {
            const key = `${item.type}:${item.name.toLowerCase()}:${item.parent_id || 'root'}`;
            existingMap.set(key, item.id);
        });

        // 3. Find or create Country Romania
        let countryIdStr = existingMap.get('country:românia:root') || existingMap.get('country:romania:root');
        if (!countryIdStr) {
            const { data: countryData, error: countryErr } = await supabase
                .from('system_locations')
                .insert({
                    type: 'country',
                    name: 'România',
                    latitude: 45.943161,
                    longitude: 24.96676
                })
                .select()
                .single();
            if (countryErr) throw countryErr;
            countryIdStr = countryData.id as string;
            existingMap.set(`country:românia:root`, countryIdStr);
        }
        const countryId = countryIdStr;

        // 4. Identify unique counties
        const countyMap = new Map<string, any>(); // key: countyName, value: { lat, lng }
        dataset.forEach(item => {
            const cName = item.judet;
            if (!countyMap.has(cName)) {
                countyMap.set(cName, { lat: item.lat, lng: item.lng });
            }
        });

        // Create missing counties
        const countiesToInsert: any[] = [];
        for (const [cName, coords] of countyMap.entries()) {
            const key = `county:${cName.toLowerCase()}:${countryId}`;
            if (!existingMap.has(key)) {
                countiesToInsert.push({
                    type: 'county',
                    name: cName,
                    parent_id: countryId,
                    latitude: coords.lat || null,
                    longitude: coords.lng || null
                });
            }
        }

        if (countiesToInsert.length > 0) {
            const { data: insertedCounties, error: insErr } = await supabase
                .from('system_locations')
                .insert(countiesToInsert)
                .select();
            if (insErr) throw insErr;
            insertedCounties.forEach((c: any) => {
                const key = `county:${c.name.toLowerCase()}:${countryId}`;
                existingMap.set(key, c.id);
            });
        }

        // Map of county name -> ID
        const countyNameToId = new Map<string, string>();
        for (const cName of countyMap.keys()) {
            const key = `county:${cName.toLowerCase()}:${countryId}`;
            const id = existingMap.get(key);
            if (id) {
                countyNameToId.set(cName, id);
            }
        }

        // 5. Identify missing cities
        const citiesToInsert: any[] = [];
        dataset.forEach(item => {
            const cName = item.judet;
            const parentId = countyNameToId.get(cName);
            if (!parentId) return;

            const key = `city:${item.nume.toLowerCase()}:${parentId}`;
            if (!existingMap.has(key)) {
                citiesToInsert.push({
                    type: 'city',
                    name: item.nume,
                    parent_id: parentId,
                    latitude: item.lat || null,
                    longitude: item.lng || null
                });
            }
        });

        // Batch insert cities in chunks of 1000 to avoid packet size limitations
        const chunkSize = 1000;
        let insertedCitiesCount = 0;
        for (let i = 0; i < citiesToInsert.length; i += chunkSize) {
            const chunk = citiesToInsert.slice(i, i + chunkSize);
            const { data: insertedChunks, error: chunkErr } = await supabase
                .from('system_locations')
                .insert(chunk)
                .select();
            if (chunkErr) throw chunkErr;
            insertedCitiesCount += chunk.length;
            
            // Add to existingMap for neighborhood matching
            if (insertedChunks) {
                insertedChunks.forEach((c: any) => {
                    const key = `city:${c.name.toLowerCase()}:${c.parent_id}`;
                    existingMap.set(key, c.id);
                });
            }
        }

        // Map of City Name -> ID for neighborhood matching
        const getCityId = (cityName: string, countyName: string) => {
            const parentId = countyNameToId.get(countyName);
            if (!parentId) return null;
            return existingMap.get(`city:${cityName.toLowerCase()}:${parentId}`);
        };

        // 6. Precompiled Major Cities Neighborhoods
        const majorNeighborhoods: { [cityName: string]: { countyName: string; areas: string[] } } = {
            'Timișoara': {
                countyName: 'Timiș',
                areas: ['Aradului', 'Bastion', 'Blașcovici', 'Braytim', 'Bucovina', 'Buziașului', 'Centru / Cetate', 'Ciarda Roșie', 'Circumvalațiunii', 'Complexul Studențesc', 'Dacia', 'Dâmbovița', 'Elisabetin', 'Fabric', 'Fratelia', 'Freidorf', 'Ghiroda Nouă', 'Girocului', 'Iosefin', 'Kuncz', 'Lipovei', 'Martirilor', 'Mehala', 'Modern', 'Olimpia–Stadion', 'Plopi', 'Ronaț', 'Soarelui', 'Steaua', 'Șagului', 'Telegrafului', 'Tipografilor', 'Torontalului', 'UMT–Pădurea Verde', 'Take Ionescu', 'Simion Bărnuțiu', 'Calea Urseni', 'Zona Odobescu', 'Zona Medicină']
            },
            'București': {
                countyName: 'București',
                areas: ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Băneasa', 'Aviatorilor', 'Dorobanți', 'Primaverii', 'Floreasca', 'Pipera', 'Tei', 'Colentina', 'Pantelimon', 'Titan', 'Dristor', 'Văcărești', 'Berceni', 'Giurgiului', 'Ferentari', 'Rahova', 'Cotroceni', 'Drumul Taberei', 'Militari', 'Crângași', 'Grivița', 'Chitila']
            },
            'Cluj-Napoca': {
                countyName: 'Cluj',
                areas: ['Mănăștur', 'Gheorgheni', 'Mărăști', 'Zorilor', 'Grigorescu', 'Andrei Mureșanu', 'Centru', 'Bună Ziua', 'Europa', 'Plopilor', 'Dâmbul Rotund', 'Iris', 'Bulgaria', 'Someșeni', 'Făget', 'Becaș', 'Sopor', 'Borhanci']
            },
            'Brașov': {
                countyName: 'Brașov',
                areas: ['Astra', 'Răcădău', 'Centrul Civic', 'Centrul Vechi', 'Griviței', 'Tractorul', 'Bartolomeu', 'Craiter', 'Florilor', 'Schei', 'Noua', 'Stupini']
            },
            'Constanța': {
                countyName: 'Constanța',
                areas: ['Faleză Nord', 'Tomis I', 'Tomis II', 'Tomis III', 'Tomis Nord', 'Inel II', 'Km 4-5', 'Km 5', 'Poarta 6', 'Centru', 'Bariera Dorobanți', 'Coiciu', 'Palas', 'Compozitori', 'Mamaia']
            },
            'Iași': {
                countyName: 'Iași',
                areas: ['Copou', 'Nicolina', 'CUG', 'Alexandru cel Bun', 'Dacia', 'Păcurari', 'Tătărași', 'Podu Roș', 'Cantemir', 'Bucium', 'Galata', 'Frumoasa', 'Baza 3', 'Centru']
            }
        };

        const areasToInsert: any[] = [];
        for (const [cityName, cityInfo] of Object.entries(majorNeighborhoods)) {
            const cityId = getCityId(cityName, cityInfo.countyName);
            if (!cityId) continue;

            cityInfo.areas.forEach(aName => {
                const key = `area:${aName.toLowerCase()}:${cityId}`;
                if (!existingMap.has(key)) {
                    areasToInsert.push({
                        type: 'area',
                        name: aName,
                        parent_id: cityId,
                        latitude: null,
                        longitude: null
                    });
                }
            });
        }

        if (areasToInsert.length > 0) {
            const { error: areaErr } = await supabase
                .from('system_locations')
                .insert(areasToInsert);
            if (areaErr) throw areaErr;
        }

        revalidatePath('/dashboard/admin/settings/locations');
        return {
            success: true,
            message: `Successfully imported Romania: ${countiesToInsert.length} new counties, ${insertedCitiesCount} new cities, and ${areasToInsert.length} new neighborhoods.`
        };
    } catch (err: any) {
        console.error("Failed to import Romania locations:", err);
        return { success: false, error: err.message || 'Failed to import Romania locations' };
    }
}


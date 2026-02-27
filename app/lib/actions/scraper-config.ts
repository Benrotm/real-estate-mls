'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ScraperConfig {
    id: string;
    domain: string;
    name: string;
    selectors: {
        // Step 1: Basics
        title: string;
        price: string;
        currency: string;
        description: string;
        type: string;
        listing_type: string;

        // Contact
        owner_name: string;
        owner_phone: string;
        private_notes: string;

        // Step 2: Location
        location: string; // Full address string
        location_county: string;
        location_city: string;
        location_area: string;

        // Step 3: Specs
        rooms: string;
        bedrooms: string;
        bathrooms: string;

        area: string; // Generic area
        area_usable: string;
        area_built: string;
        area_terrace: string;
        area_garden: string;

        floor: string;
        total_floors: string;
        year_built: string;

        partitioning: string; // decomandat etc
        comfort: string; // 1, 2 etc

        building_type: string; // block, house etc
        interior_condition: string;
        furnishing: string;

        // Step 4: Features & Media
        features: string; // Selector for feature list items
        images: string;
        video_url: string;
        virtual_tour_url: string;
    };
    isActive: boolean;

    // Auto-Scraper / Automator Fields
    category_url?: string;
    link_selector?: string;
    last_scraped_id?: number;
    delay_min?: number;
    delay_max?: number;
    auto_interval?: number;
    watcher_interval_hours?: number;
}

export async function getScraperConfigs(): Promise<ScraperConfig[]> {
    const supabase = await createClient();

    // Fallback to mock if table doesn't exist yet (optimization for dev without migration run)
    // But ideally we just query.

    const { data, error } = await supabase
        .from('scraper_configs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching scraper configs:', error);
        return [];
    }

    // Map DB snake_case (if any) to camelCase if needed, but here we used jsonb for selectors so it matches
    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        domain: item.domain,
        selectors: item.selectors,
        isActive: item.is_active,
        category_url: item.category_url,
        link_selector: item.link_selector,
        last_scraped_id: item.last_scraped_id,
        delay_min: item.delay_min,
        delay_max: item.delay_max,
        auto_interval: item.auto_interval,
        watcher_interval_hours: item.watcher_interval_hours
    }));
}

export async function saveScraperConfig(config: ScraperConfig): Promise<{ success: boolean; message: string; data?: ScraperConfig }> {
    const supabase = await createClient();

    try {
        const payload = {
            name: config.name,
            domain: config.domain,
            selectors: config.selectors,
            is_active: config.isActive,
            category_url: config.category_url,
            link_selector: config.link_selector,
            last_scraped_id: config.last_scraped_id || 1,
            delay_min: config.delay_min || 5,
            delay_max: config.delay_max || 15,
            auto_interval: config.auto_interval || 15,
            watcher_interval_hours: config.watcher_interval_hours || 4,
            updated_at: new Date().toISOString()
        };

        let result;

        if (config.id) {
            // Update
            result = await supabase
                .from('scraper_configs')
                .update(payload)
                .eq('id', config.id)
                .select()
                .single();
        } else {
            // Insert
            result = await supabase
                .from('scraper_configs')
                .insert(payload)
                .select()
                .single();
        }

        if (result.error) throw result.error;

        revalidatePath('/dashboard/admin/properties/import');

        const saved = result.data;
        return {
            success: true,
            message: 'Configuration saved successfully',
            data: {
                id: saved.id,
                name: saved.name,
                domain: saved.domain,
                selectors: saved.selectors,
                isActive: saved.is_active,
                category_url: saved.category_url,
                link_selector: saved.link_selector,
                last_scraped_id: saved.last_scraped_id,
                delay_min: saved.delay_min,
                delay_max: saved.delay_max,
                auto_interval: saved.auto_interval,
                watcher_interval_hours: saved.watcher_interval_hours
            }
        };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteScraperConfig(id: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('scraper_configs')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/dashboard/admin/properties/import');
    return { success: true, message: 'Configuration deleted' };
}

import { createClient } from '@supabase/supabase-js';
import { MOCK_PROPERTIES } from '../app/lib/properties';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// This is a temporary script to seed the database
// You can run it locally with ts-node or similar if environment variables are set
// Or I can execute the core logic via a server action if needed.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Note: Use Service Role Key for migration if RLS is strict
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting migration...');

    for (const prop of MOCK_PROPERTIES) {
        const { data, error } = await supabase
            .from('properties')
            .upsert({
                id: prop.id,
                owner_id: prop.owner_id,
                listing_type: prop.listing_type,
                currency: prop.currency,
                title: prop.title,
                description: prop.description,
                address: prop.address,
                location_city: prop.location_city,
                location_county: prop.location_county,
                location_area: prop.location_area,
                // zip/lat/lng if available in mock, otherwise undefined or adapt
                // lat: prop.latitude,
                // lng: prop.longitude, 
                price: prop.price,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                area_usable: prop.area_usable,
                area_built: prop.area_built,
                year_built: prop.year_built,
                type: prop.type,
                // stories/floor mapping
                floor: prop.floor,
                total_floors: prop.total_floors,
                partitioning: prop.partitioning,
                comfort: prop.comfort,

                features: prop.features,
                images: prop.images,
                virtual_tour_url: prop.virtual_tour_url,
                promoted: prop.promoted,
                status: prop.status || 'active',

                // Add default valuation if needed or skip
                valuation_estimated_price: prop.price * 0.95, // mock logic
                valuation_confidence: 85,
                valuation_last_updated: new Date().toISOString()
            });

        if (error) {
            console.error(`Error migrating property ${prop.id}:`, error);
        } else {
            console.log(`Migrated property ${prop.id}`);
        }
    }

    console.log('Migration finished.');
}

migrate();

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
                listing_type: prop.listingType,
                currency: prop.currency,
                title: prop.title,
                description: prop.description,
                address: prop.location.address,
                city: prop.location.city,
                state: prop.location.state,
                zip: prop.location.zip,
                lat: prop.location.lat,
                lng: prop.location.lng,
                price: prop.price,
                beds: prop.specs.beds,
                baths: prop.specs.baths,
                sqft: prop.specs.sqft,
                year_built: prop.specs.yearBuilt,
                property_type: prop.specs.type,
                stories: prop.specs.stories,
                floor: prop.specs.floor,
                interior_rating: prop.specs.interiorRating,
                features: prop.features,
                images: prop.images,
                virtual_tour_url: prop.virtualTourUrl,
                virtual_tour_type: prop.virtualTourType || 'No Virtual Tour',
                is_featured: prop.isFeatured,
                // Add default valuation if missing in mock
                valuation_estimated_price: prop.valuation?.estimatedPrice ?? 0,
                valuation_confidence: prop.valuation?.confidence ?? 0,
                valuation_last_updated: prop.valuation?.lastUpdated ?? new Date().toISOString()
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    try {
        // 1. Security Check
        const authHeader = req.headers.get('Authorization');
        const apiKey = process.env.EXPORT_API_KEY;

        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Query Parameters
        const { searchParams } = new URL(req.url);
        const updatedSince = searchParams.get('updated_since');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // 3. Initialize Supabase Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 4. Build Query
        let query = supabase
            .from('properties')
            .select('*')
            .eq('status', 'active')
            .order('updated_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (updatedSince) {
            query = query.gt('updated_at', updatedSince);
        }

        const { data: properties, error } = await query;

        if (error) {
            console.error('Export API Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 5. Map Data to Clean Format
        const formattedListings = (properties || []).map(p => {
            // Resolve Images: Convert storage paths to public URLs if needed
            const resolveImage = (path: string) => {
                if (!path) return '';
                if (path.startsWith('http')) return path;
                return `${supabaseUrl}/storage/v1/object/public/property-images/${path}`;
            };

            return {
                id: p.id,
                friendly_id: p.friendly_id,
                title: p.title,
                description: p.description,
                status: p.status,
                type: p.type,
                listing_type: p.listing_type,
                price: {
                    amount: p.price,
                    currency: p.currency || 'EUR'
                },
                location: {
                    county: p.location_county,
                    city: p.location_city,
                    area: p.location_area,
                    address: p.address,
                    coordinates: {
                        lat: p.latitude,
                        lng: p.longitude
                    }
                },
                specs: {
                    rooms: p.rooms,
                    bedrooms: p.bedrooms,
                    bathrooms: p.bathrooms,
                    area_usable: p.area_usable,
                    area_built: p.area_built,
                    area_terrace: p.area_terrace,
                    area_garden: p.area_garden,
                    area_box: p.area_box,
                    year_built: p.year_built,
                    floor: p.floor,
                    total_floors: p.total_floors,
                    partitioning: p.partitioning,
                    comfort: p.comfort,
                    building_type: p.building_type,
                    interior_condition: p.interior_condition,
                    furnishing: p.furnishing
                },
                media: {
                    images: (p.images || []).map(resolveImage),
                    video_url: p.video_url || p.youtube_video_url,
                    virtual_tour_url: p.virtual_tour_url
                },
                features: p.features || [],
                timestamps: {
                    created_at: p.created_at,
                    updated_at: p.updated_at
                },
                metadata: {
                    promoted: p.promoted,
                    views_count: p.views_count
                }
            };
        });

        return NextResponse.json({
            count: formattedListings.length,
            limit,
            offset,
            data: formattedListings
        });

    } catch (err: any) {
        console.error('Fatal Export API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}

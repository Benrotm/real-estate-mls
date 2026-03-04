import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!authHeader || !authHeader.includes(supabaseKey || '___none___')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'No Google Maps API key configured' }, { status: 500 });
    }

    // City-to-county map for fixing addresses
    const cityCountyMap: Record<string, string> = {
        'bucuresti': 'Bucuresti', 'bucharest': 'Bucuresti',
        'constanta': 'Constanta', 'constanța': 'Constanta',
        'cluj-napoca': 'Cluj', 'cluj': 'Cluj',
        'timisoara': 'Timis', 'timișoara': 'Timis',
        'iasi': 'Iasi', 'iași': 'Iasi',
        'brasov': 'Brasov', 'brașov': 'Brasov',
        'craiova': 'Dolj', 'galati': 'Galati',
        'ploiesti': 'Prahova', 'oradea': 'Bihor', 'arad': 'Arad',
        'pitesti': 'Arges', 'sibiu': 'Sibiu',
        'pantelimon': 'Ilfov', 'bragadiru': 'Ilfov', 'voluntari': 'Ilfov',
        'popesti-leordeni': 'Ilfov', 'otopeni': 'Ilfov',
        'micesti': 'Arges', 'urseni': 'Timis',
    };

    // Get all FluxMLS properties (those with "Romania" in address from scraper)
    const { data: props } = await supabase.from('properties')
        .select('id, title, address, location_city, location_county, location_area, latitude, longitude')
        .ilike('address', '%Romania%');

    if (!props) return NextResponse.json({ error: 'No properties found' }, { status: 404 });

    let fixed = 0;
    const results: string[] = [];

    for (const p of props) {
        // 1. Fix county if needed
        let county = p.location_county || '';
        if (p.location_city) {
            const cityLower = p.location_city.toLowerCase().normalize('NFC');
            const correctCounty = cityCountyMap[cityLower];
            if (correctCounty && correctCounty !== county) {
                county = correctCounty;
            }
        }

        // 2. Build clean address (deduplicate city/county)
        const countyForAddr = county && county.toLowerCase() !== (p.location_city || '').toLowerCase() ? county : '';
        const addrParts = [p.location_area, p.location_city, countyForAddr, 'Romania'].filter((x: string) => x && x.length > 1);
        const newAddr = addrParts.join(', ');

        // 3. Geocode
        try {
            const params = new URLSearchParams({ address: newAddr, key: apiKey });
            const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
            const geoData = await geoRes.json();

            if (geoData.status === 'OK' && geoData.results?.[0]) {
                const loc = geoData.results[0].geometry.location;

                await supabase.from('properties').update({
                    address: newAddr,
                    location_county: county,
                    latitude: loc.lat,
                    longitude: loc.lng
                }).eq('id', p.id);

                results.push(`✅ ${p.title?.substring(0, 40)} → ${newAddr} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
                fixed++;
            } else {
                results.push(`⚠️ ${p.title?.substring(0, 40)} → ${newAddr} (geocode: ${geoData.status})`);
            }
        } catch (e: any) {
            results.push(`❌ ${p.title?.substring(0, 40)} → ${e.message}`);
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
    }

    return NextResponse.json({ fixed, total: props.length, results });
}

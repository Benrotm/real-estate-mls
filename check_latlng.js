require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatLng() {
    // Get the 3 most recent properties
    const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, location_city, location_county, location_area, latitude, longitude, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("DB Error:", error);
        return;
    }

    console.log("=== Latest 3 Properties ===");
    data.forEach(p => {
        console.log(`\nTitle: ${p.title}`);
        console.log(`Address: ${p.address}`);
        console.log(`City: ${p.location_city} | County: ${p.location_county} | Area: ${p.location_area}`);
        console.log(`Latitude: ${p.latitude} | Longitude: ${p.longitude}`);
        console.log(`Created: ${p.created_at}`);
    });

    // Also test geocoding with the API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log(`\n=== Google Maps API Key: ${apiKey ? 'EXISTS (' + apiKey.substring(0, 10) + '...)' : 'MISSING!'} ===`);

    if (apiKey) {
        const testAddr = 'Aradului, Timisoara, Timis, Romania';
        const params = new URLSearchParams({ address: testAddr, key: apiKey });
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
        const geoData = await res.json();
        console.log(`\nTest Geocode "${testAddr}":`);
        console.log(`Status: ${geoData.status}`);
        if (geoData.results && geoData.results[0]) {
            const loc = geoData.results[0].geometry.location;
            console.log(`Lat: ${loc.lat} | Lng: ${loc.lng}`);
        } else {
            console.log('No results. Error message:', geoData.error_message || 'none');
        }
    }
}

checkLatLng();

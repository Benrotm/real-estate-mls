import fetch from 'node-fetch';

async function geocode(addressString) {
    try {
        const query = encodeURIComponent(addressString + ', Romania');
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`, {
            headers: {
                'User-Agent': 'Imobum-Bot/1.0' // Nominatim strictly requires a User-Agent
            }
        });

        const data = await res.json();

        if (data && data.length > 0) {
            console.log(`Success for "${addressString}": Lat ${data[0].lat}, Lon ${data[0].lon}`);
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } else {
            console.log(`Failed to find coordinates for "${addressString}"`);
            return null;
        }
    } catch (e) {
        console.error("Geocoder error", e);
        return null;
    }
}

async function test() {
    await geocode("Timisoara");
    await geocode("Timisoara, Aradului");
    await geocode("Timisoara, Torontalului");
}
test();

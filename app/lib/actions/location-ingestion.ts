import { createAdminClient } from '@/app/lib/supabase/admin';
import { normalizeText, cleanCityName, sanitizeLocationText } from '@/app/lib/constants/locations';

export async function processAndNormalizePropertyLocation(propertyData: Record<string, any>): Promise<Record<string, any>> {
    try {
        const supabase = createAdminClient();

        // Perform strict location sanitization
        if (propertyData.location_city) {
            const citySan = sanitizeLocationText(String(propertyData.location_city));
            propertyData.location_city = citySan.city || propertyData.location_city;
            if (!propertyData.location_area && citySan.area) {
                propertyData.location_area = citySan.area;
            }
        }

        if (propertyData.location_area) {
            const areaSan = sanitizeLocationText(String(propertyData.location_area));
            propertyData.location_area = areaSan.cleanText || propertyData.location_area;
        }

        if (propertyData.address) {
            propertyData.address = sanitizeLocationText(String(propertyData.address)).cleanText;
        }

        let city = propertyData.location_city ? cleanCityName(propertyData.location_city) : '';
        let area = propertyData.location_area ? String(propertyData.location_area).trim() : '';

        if (!city) return propertyData;

        // 1. Fetch existing system locations
        const { data: sysLocs } = await supabase
            .from('system_locations')
            .select('*');

        const normalizedCity = normalizeText(city);
        const existingCity = sysLocs?.find(loc => loc.type === 'city' && normalizeText(loc.name) === normalizedCity);

        // 2. Title & Description NLP Area Extraction (if location_area is blank)
        if (!area && (propertyData.title || propertyData.description)) {
            const cityAreas = sysLocs?.filter(loc => loc.type === 'area' && (loc.parent_id === existingCity?.id || !loc.parent_id)) || [];
            
            const titleText = propertyData.title || '';
            // Strip proximity phrases to prevent false-positives for nearby landmarks
            const descText = (propertyData.description || '').replace(/(la\s+\d+\s+minute\s+de|în\s+apropiere\s+de|aproape\s+de|lângă|spre)\s+[^\.\!\?]+/gi, '');

            let matchedArea: string | null = null;

            // Highest weight: Title match
            for (const locArea of cityAreas) {
                const normArea = normalizeText(locArea.name);
                if (normArea.length > 2 && normalizeText(titleText).includes(normArea)) {
                    matchedArea = locArea.name;
                    break;
                }
            }

            // Secondary weight: Cleaned Description match
            if (!matchedArea) {
                for (const locArea of cityAreas) {
                    const normArea = normalizeText(locArea.name);
                    if (normArea.length > 3 && normalizeText(descText).includes(normArea)) {
                        matchedArea = locArea.name;
                        break;
                    }
                }
            }

            if (matchedArea) {
                area = matchedArea;
                propertyData.location_area = area;
            }
        }

        // 3. Dynamic Auto-Ingestion of Unmapped Areas into system_locations
        if (area) {
            const normArea = normalizeText(area);
            const existingArea = sysLocs?.find(loc => loc.type === 'area' && normalizeText(loc.name) === normArea);

            if (!existingArea) {
                let lat: number | null = null;
                let lng: number | null = null;

                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                if (apiKey) {
                    try {
                        const fullAddr = `${area}, ${city}, Romania`;
                        const params = new URLSearchParams({ address: fullAddr, key: apiKey });
                        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
                        const json = await res.json();
                        if (json.status === 'OK' && json.results?.[0]?.geometry?.location) {
                            lat = json.results[0].geometry.location.lat;
                            lng = json.results[0].geometry.location.lng;
                        }
                    } catch (e) {
                        console.error('[Location Ingestion] Geocode error:', e);
                    }
                }

                const parentId = existingCity?.id || null;
                await supabase.from('system_locations').insert({
                    name: area,
                    type: 'area',
                    parent_id: parentId,
                    latitude: lat,
                    longitude: lng
                });
            }
        }

        // 4. Geocode Fallback for Property Coordinates (latitude / longitude)
        if ((!propertyData.latitude || !propertyData.longitude) && (area || city)) {
            const normArea = normalizeText(area);
            const normCity = normalizeText(city);
            
            const areaLoc = sysLocs?.find(loc => loc.type === 'area' && normalizeText(loc.name) === normArea && loc.latitude && loc.longitude);
            const cityLoc = sysLocs?.find(loc => loc.type === 'city' && normalizeText(loc.name) === normCity && loc.latitude && loc.longitude);
            
            const fallbackPin = areaLoc || cityLoc;
            if (fallbackPin && fallbackPin.latitude && fallbackPin.longitude) {
                propertyData.latitude = fallbackPin.latitude;
                propertyData.longitude = fallbackPin.longitude;
            }
        }

        return propertyData;
    } catch (err) {
        console.error('[Location Ingestion Engine Error]:', err);
        return propertyData;
    }
}

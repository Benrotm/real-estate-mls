import { createClient } from '@supabase/supabase-js';

// We'll need a way to get the GOOGLE_MAPS_API_KEY. 
// Assuming it's in process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or process.env.GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface AirQualityData {
    aqi: number;
    category: string;
    pollutants: any;
}

export interface SolarData {
    solarPotentialScore: number; // 0-100?
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
}

/**
 * Fetches Air Quality data from Google Maps Air Quality API
 * https://developers.google.com/maps/documentation/air-quality/overview
 */
export async function fetchAirQuality(lat: number, lng: number): Promise<AirQualityData | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Missing GOOGLE_MAPS_API_KEY");
        return null;
    }

    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location: {
                    latitude: lat,
                    longitude: lng,
                },
                extraComputations: ["HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION", "POLLUTANT_CONCENTRATION", "LOCAL_AQI", "POLLUTANT_ADDITIONAL_INFO"]
            }),
        });

        if (!response.ok) {
            console.error(`Air Quality API Error: ${response.status} ${response.statusText}`);
            return null; // Graceful fallback
        }

        const data = await response.json();

        // Parse response to find Universal AQI or local
        // Simplify for MVP
        const index = data.indexes?.find((i: any) => i.code === 'universal_aqi') || data.indexes?.[0];

        return {
            aqi: index?.aqi || 0,
            category: index?.category || 'Unknown',
            pollutants: data.pollutants
        };

    } catch (error) {
        console.error("Failed to fetch Air Quality", error);
        return null;
    }
}

/**
 * Fetches Solar potential from Google Solar API
 * https://developers.google.com/maps/documentation/solar/overview
 */
export async function fetchSolarPotential(lat: number, lng: number): Promise<SolarData | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("Missing GOOGLE_MAPS_API_KEY");
        return null;
    }

    // Solar API 'buildingInsights'
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&requiredQuality=HIGH&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            // 404 means no building found often, or coverage missing
            if (response.status !== 404) {
                console.error(`Solar API Error: ${response.status} ${response.statusText}`);
            }
            return null;
        }

        const data = await response.json();

        // Solar API returns detailed config. We want a summary.
        // Normalize maxSunshineHoursPerYear
        const maxSunshine = data.solarPotential?.maxSunshineHoursPerYear || 0;

        // Calculate a score 0-100 based on some heuristic or use data
        // For now, let's say > 2000 hours is Great (100)
        const score = Math.min(100, Math.round((maxSunshine / 2000) * 100));

        return {
            solarPotentialScore: score,
            maxSunshineHoursPerYear: maxSunshine,
            carbonOffsetFactorKgPerMwh: data.solarPotential?.carbonOffsetFactorKgPerMwh || 0
        };

    } catch (error) {
        console.error("Failed to fetch Solar Data", error);
        return null;
    }
}

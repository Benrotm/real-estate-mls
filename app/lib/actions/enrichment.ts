'use server';

import { Property } from '@/app/lib/properties';

/**
 * Extracts structured property data from an unstructured description using regex keyword matching.
 */
export async function enrichPropertyFromDescription(description: string, currentData: Partial<Property>): Promise<Partial<Property>> {
    if (!description) return currentData;

    const text = description.toLowerCase();
    const enriched = { ...currentData };

    // 1. Partitioning (Decomandat, etc.)
    if (!enriched.partitioning) {
        if (text.includes('decomandat') && !text.includes('semidecomandat') && !text.includes('nedecomandat')) enriched.partitioning = 'Decomandat';
        else if (text.includes('semidecomandat')) enriched.partitioning = 'Semidecomandat';
        else if (text.includes('nedecomandat')) enriched.partitioning = 'Nedecomandat';
        else if (text.includes('circular')) enriched.partitioning = 'Circular';
        else if (text.includes('vagon')) enriched.partitioning = 'Vagon';
    }

    // 2. Comfort (Lux, 1, 2, 3)
    if (!enriched.comfort) {
        if (text.includes('confort lux') || text.includes('comfort lux') || text.includes('finisaje lux')) enriched.comfort = 'Lux';
        else if (text.includes('confort 1') || text.includes('comfort 1')) enriched.comfort = '1';
        else if (text.includes('confort 2') || text.includes('comfort 2')) enriched.comfort = '2';
        else if (text.includes('confort 3') || text.includes('comfort 3')) enriched.comfort = '3';
    }

    // 3. Condition (Newly Built, Renovated, etc.)
    if (!enriched.interior_condition) {
        if (text.includes('constructie noua') || text.includes('newly built') || text.includes('bloc nou')) enriched.interior_condition = 'Newly Built';
        else if (text.includes('renovat') || text.includes('proaspat renovat')) enriched.interior_condition = 'Renovated';
        else if (text.includes('stare buna') || text.includes('good condition')) enriched.interior_condition = 'Good';
        else if (text.includes('necesita renovare') || text.includes('needs renovation')) enriched.interior_condition = 'Needs Renovation';
    }

    // 4. Furnishing
    if (!enriched.furnishing) {
        if (text.includes('mobilat lux')) enriched.furnishing = 'Luxury Furnished';
        else if (text.includes('mobilat si utilat') || text.includes('complet mobilat')) enriched.furnishing = 'Furnished';
        else if (text.includes('partial mobilat')) enriched.furnishing = 'Semi-furnished';
        else if (text.includes('nemobilat')) enriched.furnishing = 'Unfurnished';
    }

    // 5. Features (AC, Centrala, etc.)
    const currentFeatures = Array.isArray(enriched.features) ? [...enriched.features] : [];
    const featureMap: Array<{ keywords: string[], token: string }> = [
        { keywords: ['aer conditionat', ' ac ', 'clima'], token: 'Air Conditioning' },
        { keywords: ['centrala termica', 'centrala proprie'], token: 'Central Heating' },
        { keywords: ['parcare', 'loc parcare', 'parking'], token: 'Parking' },
        { keywords: ['garaj', 'garage'], token: 'Garage' },
        { keywords: ['lift', 'ascensor'], token: 'Elevator' },
        { keywords: ['balcon'], token: 'Balcony' },
        { keywords: ['terasa', 'terace'], token: 'Terrace' },
        { keywords: ['piscina', 'pool'], token: 'Swimming Pool' },
        { keywords: ['sauna'], token: 'Sauna' },
        { keywords: ['gradina', 'garden'], token: 'Common Garden' },
        { keywords: ['paza', 'security', 'supraveghere'], token: '24/7 Security' },
        { keywords: ['interfon'], token: 'Intercom' },
        { keywords: ['frigider'], token: 'Kitchen Appliances' },
        { keywords: ['curte proprie'], token: 'Private Pool' }, // Close enough for scoring if they have a yard
    ];

    featureMap.forEach(({ keywords, token }) => {
        if (!currentFeatures.includes(token)) {
            if (keywords.some(k => text.includes(k))) {
                currentFeatures.push(token);
            }
        }
    });

    enriched.features = currentFeatures;

    return enriched;
}

/**
 * Geocodes an address or city/area combination using Nominatim.
 */
export async function geocodeProperty(property: Partial<Property>): Promise<{ lat: number | null, lon: number | null }> {
    const city = property.location_city || '';
    const area = property.location_area || '';
    const address = property.address || '';
    const county = property.location_county || 'Timis';

    // Build search query: prioritize specific address, then area, then city
    const queries = [
        `${address}, ${city}, ${county}, Romania`,
        `${area}, ${city}, ${county}, Romania`,
        `${city}, ${county}, Romania`
    ].filter(q => q.length > 10); // avoid empty or too short queries

    for (const query of queries) {
        try {
            const encodedQuery = encodeURIComponent(query);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`, {
                headers: {
                    'User-Agent': 'RealEstateMLS/1.0 (contact@imobum.com)'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    return {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon)
                    };
                }
            }
        } catch (error) {
            console.error(`Geocoding failed for query "${query}":`, error);
        }
    }

    return { lat: null, lon: null };
}

import { Property } from '@/app/lib/properties';

const ROMIMO_API_BASE = 'https://services.romimo.ro/api';

// Simple in-memory cache for the token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Maps Imobum property category to Romimo category ID (placeholder mapping).
 * TODO: Replace with actual category mapping from Romimo once provided.
 */
function mapToRomimoCategory(type: string, listingType: string): number {
    // Romimo category placeholders based on document (312, 337, etc.)
    if (listingType === 'For Sale') {
        if (type === 'Apartment') return 337;
        if (type === 'House') return 338;
        if (type === 'Land') return 339;
        return 312; // default
    } else {
        // For Rent
        if (type === 'Apartment') return 340;
        if (type === 'House') return 341;
        return 312; // default
    }
}

/**
 * Gets a valid Romimo API token, using cache if available.
 */
export async function getRomimoToken(): Promise<string | null> {
    const apiKey = process.env.ROMIMO_API_KEY;
    if (!apiKey) {
        console.error('ROMIMO_API_KEY is not defined in environment variables');
        return null;
    }

    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    try {
        const response = await fetch(`${ROMIMO_API_BASE}/Token?ApiKey=${apiKey}`, {
            method: 'POST',
            headers: {
                'x-api-version': '2'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch Romimo token:', await response.text());
            return null;
        }

        const token = await response.text(); // Format: "eyJhbG..." (includes quotes possibly, so we clean it up if needed)
        const cleanToken = token.replace(/^"|"$/g, '');
        
        cachedToken = cleanToken;
        // Token expires in 24 hours, cache it for 23 hours to be safe
        tokenExpiresAt = Date.now() + (23 * 60 * 60 * 1000);
        
        return cleanToken;
    } catch (error) {
        console.error('Error fetching Romimo token:', error);
        return null;
    }
}

/**
 * Maps Imobum Property to Romimo Article schema and upserts it.
 */
export async function upsertRomimoArticle(property: Property, userEmail: string) {
    const token = await getRomimoToken();
    if (!token) return { error: 'Failed to obtain Romimo token' };

    if (!userEmail) return { error: 'User email is required for Romimo sync' };

    const validFrom = property.published_at || new Date().toISOString();
    
    // Default validTo: 30 days from validFrom
    const validToDate = new Date(validFrom);
    validToDate.setDate(validToDate.getDate() + 30);
    const validTo = validToDate.toISOString();

    const propertiesPayload = [];
    if (property.year_built) propertiesPayload.push({ key: 'yearofbuilding', value: property.year_built.toString() });
    if (property.area_usable) propertiesPayload.push({ key: 'livingspace', value: property.area_usable.toString() });
    if (property.rooms) propertiesPayload.push({ key: 'rooms', value: property.rooms.toString() });
    if (property.bathrooms) propertiesPayload.push({ key: 'bathrooms', value: property.bathrooms.toString() });
    if (property.floor !== undefined && property.floor !== null) propertiesPayload.push({ key: 'floor', value: property.floor.toString() });

    const payload = {
        user: {
            email: userEmail
        },
        ad: {
            active: property.status === 'active',
            promoted: property.promoted || false,
            externalid: property.id,
            category: mapToRomimoCategory(property.type, property.listing_type),
            price: property.price || 0,
            currency: property.currency || 'EUR',
            title: property.title || 'Property',
            text: property.description || '',
            validFrom: validFrom,
            validTo: validTo
        },
        contact: {
            contactName: property.owner_name || property.owner?.full_name || '',
            contactEmail: userEmail,
            contactPhone: property.owner_phone || property.owner?.phone || ''
        },
        location: {
            countyName: property.location_county || '',
            cityName: property.location_city || '',
            areaName: property.location_area || '',
            latitude: property.latitude || 0,
            longitude: property.longitude || 0
        },
        properties: propertiesPayload,
        pictures: (property.images || []).map((url, index) => ({
            url: url,
            rank: index + 1
        }))
    };

    try {
        const response = await fetch(`${ROMIMO_API_BASE}/Article`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Romimo Upsert Failed:', response.status, errorText);
            return { error: `Romimo API error: ${response.status}`, details: errorText };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Exception in upsertRomimoArticle:', error);
        return { error: error.message };
    }
}

/**
 * Gets the status of an article from Romimo.
 */
export async function getRomimoArticle(email: string, externalId: string) {
    const token = await getRomimoToken();
    if (!token) return { error: 'Failed to obtain Romimo token' };

    try {
        const response = await fetch(`${ROMIMO_API_BASE}/Article?Email=${encodeURIComponent(email)}&ExternalId=${encodeURIComponent(externalId)}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Romimo API error: ${response.status}`, details: errorText };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error: any) {
        return { error: error.message };
    }
}

/**
 * Deletes an article from Romimo.
 */
export async function deleteRomimoArticle(email: string, externalId: string) {
    const token = await getRomimoToken();
    if (!token) return { error: 'Failed to obtain Romimo token' };

    try {
        const response = await fetch(`${ROMIMO_API_BASE}/Article?Email=${encodeURIComponent(email)}&ExternalId=${encodeURIComponent(externalId)}`, {
            method: 'DELETE',
            headers: {
                'x-api-version': '2',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            return { error: `Romimo API error: ${response.status}`, details: errorText };
        }

        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

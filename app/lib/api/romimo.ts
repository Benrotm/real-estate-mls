import { Property } from '@/app/lib/properties';

const ROMIMO_API_BASE = 'https://services.romimo.ro/api';

// Simple in-memory cache for the token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Maps Imobum property category to Romimo category ID (placeholder mapping).
 * TODO: Replace with actual category mapping from Romimo once provided.
 */
function mapToRomimoCategory(property: Property): number {
    const type = property.type;
    const listingType = property.listing_type;
    const rooms = property.rooms ? Number(property.rooms) : null;

    const isSale = listingType === 'For Sale';

    if (isSale) {
        switch (type) {
            case 'Apartment':
                if (rooms === 1) return 337; // apartamente 1 camera
                if (rooms === 2) return 338; // apartamente 2 camere
                if (rooms === 3) return 339; // apartamente 3 camere
                if (rooms === 4) return 340; // apartamente 4 camere
                if (rooms === 5) return 341; // apartamente 5 camere
                if (rooms && rooms >= 6) return 342; // apartamente 6 camere
                return 338; // default to 2 rooms
            case 'House':
                return 347; // case vile
            case 'Land':
                return 354; // teren intravilan
            case 'Commercial':
                return 361; // spatiu comercial
            case 'Industrial':
                return 358; // hala industriala
            case 'Business':
                return 361; // spatiu comercial
            case 'Other':
            default:
                return 432; // alte proprietati
        }
    } else {
        // For Rent / Hotel Regime
        switch (type) {
            case 'Apartment':
                if (rooms === 1) return 312; // apartamente 1 camera
                if (rooms === 2) return 313; // apartamente 2 camere
                if (rooms === 3) return 314; // apartamente 3 camere
                if (rooms === 4) return 315; // apartamente 4 camere
                if (rooms === 5) return 316; // apartamente 5 camere
                if (rooms && rooms >= 6) return 317; // apartamente 6 camere
                return 313; // default to 2 rooms
            case 'House':
                return 44; // case vile
            case 'Land':
                return 329; // teren intravilan
            case 'Commercial':
                return 336; // spatiu comercial
            case 'Industrial':
                return 333; // hala industriala
            case 'Business':
                return 336; // spatiu comercial
            case 'Other':
            default:
                return 313; // fallback to apartamente 2 camere
        }
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
            category: mapToRomimoCategory(property),
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

/**
 * Gets user package info from Romimo.
 */
export async function getRomimoUserPackage(email: string) {
    const token = await getRomimoToken();
    if (!token) return { error: 'Failed to obtain Romimo token' };

    try {
        const response = await fetch(`${ROMIMO_API_BASE}/User/Package?Email=${encodeURIComponent(email)}`, {
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

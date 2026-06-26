import { createAdminClient } from '@/app/lib/supabase/admin';
import { Property } from '@/app/lib/properties';

const STORIA_TOKEN_URL = process.env.STORIA_TOKEN_URL || 'https://www.olx.ro/api/open/oauth/token';
const STORIA_API_BASE = process.env.STORIA_API_BASE || 'https://api.olx.ro/api/partner';

/**
 * Maps property type and listing type to OLX/Storia category ID.
 */
function mapToStoriaCategory(property: Property): number {
    const type = property.type;
    const listingType = property.listing_type;
    const isSale = listingType === 'For Sale';

    if (isSale) {
        switch (type) {
            case 'Apartment': return 907; // Apartamente - de vanzare
            case 'House': return 909;     // Case - de vanzare
            case 'Land': return 911;      // Terenuri
            case 'Commercial': return 912; // Spatii comerciale
            case 'Industrial': return 912;
            case 'Business': return 912;
            default: return 907;
        }
    } else {
        switch (type) {
            case 'Apartment': return 908; // Apartamente - de inchiriat
            case 'House': return 910;     // Case - de inchiriat
            case 'Land': return 911;      // Terenuri
            case 'Commercial': return 912; // Spatii comerciale
            case 'Industrial': return 912;
            case 'Business': return 912;
            default: return 908;
        }
    }
}

/**
 * Resolves a city name to an OLX/Storia city_id.
 */
async function getStoriaCityId(cityName: string, accessToken: string): Promise<number> {
    if (!cityName) return 1; // Default fallback city ID

    try {
        const response = await fetch(`${STORIA_API_BASE}/cities?q=${encodeURIComponent(cityName)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Version': '2.0',
                'User-Agent': 'Imobum/1.0',
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const list = data.data || data;
            if (Array.isArray(list) && list.length > 0) {
                // Look for an exact match or fallback to the first result
                const match = list.find((c: any) => c.name.toLowerCase() === cityName.toLowerCase());
                if (match) return Number(match.id);
                return Number(list[0].id);
            }
        }
    } catch (e) {
        console.error('Error fetching city ID from Storia/OLX:', e);
    }
    return 1; // Fallback
}

/**
 * Refreshes the user's Storia OAuth credentials.
 */
export async function refreshStoriaToken(userId: string, refreshToken: string): Promise<string | null> {
    const clientId = process.env.STORIA_CLIENT_ID;
    const clientSecret = process.env.STORIA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('STORIA_CLIENT_ID or STORIA_CLIENT_SECRET is missing in environment variables');
        return null;
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('refresh_token', refreshToken);

        const response = await fetch(STORIA_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Imobum/1.0'
            },
            body: params.toString()
        });

        if (!response.ok) {
            console.error('Failed to refresh Storia token:', await response.text());
            return null;
        }

        const data = await response.json();
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken; // fallback if not rotated
        const expiresIn = data.expires_in || 3600;

        // Save new tokens to DB
        const supabase = await createAdminClient();
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
        
        await supabase
            .from('storia_tokens')
            .upsert({
                user_id: userId,
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        return newAccessToken;
    } catch (error) {
        console.error('Error in refreshStoriaToken:', error);
        return null;
    }
}

/**
 * Retrieves a valid access token for the given user, refreshing if expired.
 */
export async function getStoriaAccessToken(userId: string): Promise<string | null> {
    const supabase = await createAdminClient();
    const { data: tokenData, error } = await supabase
        .from('storia_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !tokenData) {
        console.error('Storia token not found for user:', userId);
        return null;
    }

    const expiresAt = new Date(tokenData.expires_at).getTime();
    // Refresh token if it expires in less than 5 minutes
    const isExpired = expiresAt - Date.now() < 5 * 60 * 1000;

    if (isExpired) {
        console.log('Storia token expired or expiring soon, refreshing...');
        return await refreshStoriaToken(userId, tokenData.refresh_token);
    }

    return tokenData.access_token;
}

/**
 * Upserts a property listing to Storia/OLX.
 */
export async function upsertStoriaAd(property: Property, userId: string) {
    const accessToken = await getStoriaAccessToken(userId);
    if (!accessToken) {
        return { error: 'Failed to obtain Storia access token. Account may not be linked.' };
    }

    const supabase = await createAdminClient();
    const categoryId = mapToStoriaCategory(property);
    const cityId = await getStoriaCityId(property.location_city || '', accessToken);

    // Build attributes
    const attributes: Array<{ code: string; value: string }> = [
        { code: 'listing_type', value: property.listing_type === 'For Sale' ? 'sell' : 'rent' }
    ];

    if (property.rooms) {
        attributes.push({ code: 'rooms', value: property.rooms.toString() });
        attributes.push({ code: 'rooms_num', value: property.rooms.toString() });
    }
    if (property.area_usable) {
        attributes.push({ code: 'm', value: property.area_usable.toString() });
        attributes.push({ code: 'surface', value: property.area_usable.toString() });
    }
    if (property.floor !== null && property.floor !== undefined) {
        attributes.push({ code: 'floor', value: property.floor.toString() });
        attributes.push({ code: 'floor_no', value: property.floor.toString() });
    }
    if (property.year_built) {
        attributes.push({ code: 'build_year', value: property.year_built.toString() });
        attributes.push({ code: 'year', value: property.year_built.toString() });
    }

    // Build payload
    const payload = {
        title: property.title ? property.title.substring(0, 70) : 'Property Listing',
        description: property.description || '',
        category_id: categoryId,
        price: {
            value: property.price || 0,
            currency: property.currency || 'EUR'
        },
        location: {
            city_id: cityId
        },
        attributes: attributes,
        images: (property.images || []).map((url: string) => ({ url }))
    };

    try {
        const isUpdate = !!property.storia_id;
        const url = isUpdate 
            ? `${STORIA_API_BASE}/adverts/${property.storia_id}` 
            : `${STORIA_API_BASE}/adverts`;
        const method = isUpdate ? 'PUT' : 'POST';

        console.log(`Sending ${method} request to Storia/OLX API...`);
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Version': '2.0',
                'Content-Type': 'application/json',
                'User-Agent': 'Imobum/1.0',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Storia/OLX Sync Failed:', response.status, errorText);
            return { error: `Storia API error: ${response.status}`, details: errorText };
        }

        const resData = await response.json();
        const advertData = resData.data || resData;
        const advertId = advertData.id;

        // If it was a new listing, it starts as DRAFT. We must activate it!
        if (!isUpdate && advertId) {
            console.log(`Activating Storia/OLX advert ${advertId}...`);
            const activateRes = await fetch(`${STORIA_API_BASE}/adverts/${advertId}/activate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Version': '2.0',
                    'User-Agent': 'Imobum/1.0',
                    'Accept': 'application/json'
                }
            });

            if (!activateRes.ok) {
                console.warn('Storia/OLX Activation Failed:', activateRes.status, await activateRes.text());
            }

            // Save the Storia ID in our database
            await supabase
                .from('properties')
                .update({ storia_id: advertId.toString() })
                .eq('id', property.id);
        }

        return { success: true, storiaId: advertId };
    } catch (error: any) {
        console.error('Exception in upsertStoriaAd:', error);
        return { error: error.message };
    }
}

/**
 * Deletes a property listing from Storia/OLX.
 */
export async function deleteStoriaAd(propertyId: string, userId: string) {
    const supabase = await createAdminClient();

    // Fetch the property's storia_id
    const { data: property, error: fetchErr } = await supabase
        .from('properties')
        .select('storia_id')
        .eq('id', propertyId)
        .single();

    if (fetchErr || !property || !property.storia_id) {
        console.log('Property does not have a Storia ID. Skipping delete.');
        return { success: true };
    }

    const accessToken = await getStoriaAccessToken(userId);
    if (!accessToken) {
        return { error: 'Failed to obtain Storia access token. Account may not be linked.' };
    }

    try {
        console.log(`Deleting Storia/OLX advert ${property.storia_id}...`);
        const response = await fetch(`${STORIA_API_BASE}/adverts/${property.storia_id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Version': '2.0',
                'User-Agent': 'Imobum/1.0',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Storia/OLX Delete Failed:', response.status, errorText);
            return { error: `Storia API error: ${response.status}`, details: errorText };
        }

        // Clear storia_id from the database
        await supabase
            .from('properties')
            .update({ storia_id: null })
            .eq('id', propertyId);

        return { success: true };
    } catch (error: any) {
        console.error('Exception in deleteStoriaAd:', error);
        return { error: error.message };
    }
}

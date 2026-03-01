import crypto from 'crypto';

/**
 * Normalizes input text by removing spaces, special characters, and converting to lowercase.
 * E.g. "Str. Lunga, Nr 10, Brasov" -> "strlunganr10brasov"
 */
function normalizeString(str: string | null | undefined): string {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generates a SHA-256 hash fingerprint for a property based on key identifiers:
 * - Normalized Address (City + Neighborhood + Address/Street)
 * - Number of Rooms (if available)
 * - Price (rounded to nearest 1000 to catch minor variations)
 * - Property Type
 */
export function generatePropertyFingerprint(data: {
    title?: string;
    city?: string;
    neighborhood?: string;
    address?: string;
    rooms?: number | string | null;
    price?: number | string | null;
    type?: string;
    owner_phone?: string;
}): string {
    // 1. Build a normalized location string
    const locationStr = normalizeString(data.city) + normalizeString(data.neighborhood) + normalizeString(data.address);

    // 2. Normalize rooms
    const rooms = data.rooms ? data.rooms.toString() : '0';

    // 3. Normalize price
    let priceNormalized = '0';
    if (data.price) {
        let p = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
        if (!isNaN(p)) {
            // For Rents (small prices), use more precision to avoid collisions
            if (p < 2500) {
                priceNormalized = Math.round(p).toString(); // Exact price for rents
            } else {
                // Round to nearest 500 for sales to catch minor price variations
                priceNormalized = (Math.round(p / 500) * 500).toString();
            }
        }
    }

    // 4. Normalize type
    const type = normalizeString(data.type);

    // 5. Normalise phone
    const phone = (data.owner_phone || '').replace(/[^0-9]/g, '');

    // 6. Combine into a single fingerprint string (include phone if available)
    const rawFingerprint = `${locationStr}_R:${rooms}_P:${priceNormalized}_T:${type}_PH:${phone}`;

    // 7. Hash it
    return crypto.createHash('sha256').update(rawFingerprint).digest('hex');
}

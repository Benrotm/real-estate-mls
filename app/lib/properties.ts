
export interface Property {
    id: string;
    owner_id: string;
    title: string;
    description: string;

    type: 'Apartment' | 'House' | 'Commercial' | 'Industrial' | 'Land' | 'Investment' | 'Business' | 'Other';
    listing_type: 'For Sale' | 'For Rent';

    location_county: string;
    location_city: string;
    location_area?: string;
    address?: string;
    latitude?: number;
    longitude?: number;

    price: number;
    currency: 'EUR' | 'USD' | 'RON';

    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;

    area_usable?: number;
    area_built?: number;

    year_built?: number;
    floor?: number;
    total_floors?: number;

    partitioning?: string;
    comfort?: string; // 1, 2, Lux

    features: string[]; // checkboxes

    images: string[];
    video_url?: string;
    virtual_tour_url?: string;

    status: 'active' | 'pending' | 'sold' | 'draft';
    promoted?: boolean;
    views_count?: number;

    created_at: string;
    updated_at: string;

    // Joined fields (optional)
    owner?: {
        full_name: string;
        email: string;
        phone: string;
        avatar_url: string;
    };
}

// Re-export MOCK_PROPERTIES but we should transition away from it or update it to match new schema
// For now, I'll comment it out or keep it minimal if used elsewhere until replaced.
// Actually, let's keep the MOCK_PROPERTIES for now as a fallback but updated slightly to match types if possible,
// or just ignore strict typing for the mock if it causes too much refactor noise right now.
// I will just define the valid options as constants for reuse
export const PROPERTY_TYPES = ['Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Investment', 'Business', 'Other'] as const;
export const TRANSACTION_TYPES = ['For Sale', 'For Rent'] as const;
export const CURRENCIES = ['EUR', 'USD', 'RON'] as const;
export const PARTITIONING_TYPES = ['Decomandat', 'Semidecomandat', 'Nedecomandat', 'Circular', 'Vagon'] as const;
export const COMFORT_TYPES = ['Lux', '1', '2', '3'] as const;

export const PROPERTY_FEATURES = [
    'Elevator',
    'Central Heating',
    'Solar Panels',
    'Pool',
    'Video Intercom',
    'Security',
    'Air Conditioning',
    'Parking',
    'Garden',
    'Terrace',
    'Fireplace',
    'Sauna',
    'Gym',
    'Smart Home'
] as const;

export const MOCK_PROPERTIES: Property[] = [
    {
        id: '1',
        owner_id: '430ed9f0-3164-4346-a7e3-8124f35b5053', // Valid Profile ID from DB
        title: 'Modern Apartment in City Center',
        description: 'A beautiful apartment...',
        type: 'Apartment',
        listing_type: 'For Sale',
        location_county: 'Bucuresti',
        location_city: 'Bucuresti',
        location_area: 'Unirii',
        address: 'Blvd Unirii',
        price: 150000,
        currency: 'EUR',
        rooms: 3,
        bedrooms: 2,
        bathrooms: 2,
        area_usable: 85,
        area_built: 100,
        year_built: 2020,
        floor: 3,
        total_floors: 8,
        partitioning: 'Decomandat',
        comfort: 'Lux',
        features: ['Air Conditioning', 'Central Heating'],
        images: ['/placeholder-property.jpg'],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

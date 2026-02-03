
export interface Property {
    id: string;
    owner_id: string;
    title: string;
    description: string;

    type: 'Apartment' | 'House' | 'Commercial' | 'Industrial' | 'Land' | 'Investment' | 'Business' | 'Other';
    listing_type: 'For Sale' | 'For Rent' | 'Hotel Regime';

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
    area_box?: number;
    area_terrace?: number;
    area_garden?: number;

    year_built?: number;
    floor?: number;
    total_floors?: number;

    partitioning?: string;
    comfort?: string; // 1, 2, Lux

    // Enhanced Fields
    building_type?: string;
    interior_condition?: string;
    furnishing?: string;
    youtube_video_url?: string;
    social_media_url?: string;
    personal_property_id?: string;

    features: string[]; // checkboxes

    images: string[];
    video_url?: string; // Legacy or generic video
    virtual_tour_url?: string;

    status: 'active' | 'pending' | 'sold' | 'draft';
    promoted?: boolean;
    views_count?: number;

    created_at: string;
    updated_at: string;

    score?: number; // Added score field

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
export const TRANSACTION_TYPES = ['For Sale', 'For Rent', 'Hotel Regime'] as const;
export const CURRENCIES = ['EUR', 'USD', 'RON'] as const;
export const PARTITIONING_TYPES = ['Decomandat', 'Semidecomandat', 'Nedecomandat', 'Circular', 'Vagon'] as const;
export const COMFORT_TYPES = ['Lux', '1', '2', '3'] as const;

export const BUILDING_TYPES = ['Apartment Block', 'Individual House', 'Duplex', 'Villa', 'Office Building', 'Mixed Use'] as const;
export const INTERIOR_CONDITIONS = ['Newly Built', 'Renovated', 'Good', 'Fair', 'Needs Renovation'] as const;
export const FURNISHING_TYPES = ['Unfurnished', 'Semi-furnished', 'Furnished', 'Luxury Furnished'] as const;

export const UNIT_FEATURES = [
    'Air Conditioning',
    'Central Heating',
    'Balcony',
    'Fireplace',
    'Laundry',
    'Smart Home',
    'Storage',
    'Solar Panels',
    'Private Pool',
    'Jacuzzi',
    'Parking'
] as const;

export const COMMUNITY_FEATURES = [
    'Clubhouse',
    'Park',
    'Playground',
    'Jogging Track',
    'Common Garden',
    'Party Hall',
    'Library',
    'Amphitheatre',
    'Garage'
] as const;

export const SPORTS_FEATURES = [
    'Gym',
    'Swimming Pool',
    'Basketball Court',
    'Tennis Court',
    'Football Field',
    'Squash Court',
    'Yoga Deck'
] as const;

export const SECURITY_FEATURES = [
    '24/7 Security',
    'CCTV Surveillance',
    'Gated Community',
    'Intercom',
    'Fire Safety',
    'Video Door Phone'
] as const;

export const SUSTAINABILITY_FEATURES = [
    'Green Building',
    'Rainwater Harvesting',
    'Sewage Treatment',
    'Power Backup',
    'Elevator',
    'Concierge',
    'Maintenance Staff',
    'Visitor Parking'
] as const;

export const LISTING_TAGS = [
    'Commission 0%',
    'Exclusive',
    'Luxury',
    'Hotel Regime',
    'Foreclosure'
] as const;

export const PROPERTY_FEATURES = [
    ...UNIT_FEATURES,
    ...COMMUNITY_FEATURES,
    ...SPORTS_FEATURES,
    ...SECURITY_FEATURES,
    ...SUSTAINABILITY_FEATURES,
    // Note: LISTING_TAGS are usually handled separately or merged depending on UI, 
    // but adding them here ensures strict typing if we treat them as features.
    // However, some might be processed as separate flags in the DB.
    // We will keep them in the main list for now to allow `features` column to store them if needed.
    ...LISTING_TAGS
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

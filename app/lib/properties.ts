
export interface Property {
    id: string;
    owner_id: string;
    title: string;
    description: string;

    type: 'Apartment' | 'House' | 'Commercial' | 'Industrial' | 'Land' | 'Business' | 'Other';
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
    friendly_id?: string;

    // Rental Restrictions (For Rent only)
    no_smoking_allowed?: boolean;
    no_pets_allowed?: boolean;
    no_small_kids_allowed?: boolean;

    // Private Fields (Owner/Admin only)
    private_notes?: string;
    documents?: string[];
    owner_name?: string;
    owner_phone?: string;

    features: string[]; // checkboxes

    images: string[];
    video_url?: string; // Legacy or generic video
    virtual_tour_url?: string;

    status: 'active' | 'pending' | 'sold' | 'draft';
    promoted?: boolean;
    views_count?: number;

    // Portal Distribution
    publish_imobiliare?: boolean;
    publish_storia?: boolean;
    publish_romimo?: boolean;
    publish_homezz?: boolean;
    publish_imobiliarepret?: boolean;
    publish_whatsapp_groups?: boolean;
    publish_facebook_groups?: boolean;
    publish_facebook_page?: boolean;
    publish_instagram?: boolean;
    publish_tiktok?: boolean;
    storia_id?: string;

    // Confidential Contract Fields
    contract_country?: string;
    contract_city?: string;
    contract_street?: string;
    contract_building?: string;
    contract_floor?: string;
    contract_apartment?: string;
    contract_cf_topo?: string;
    contract_owner_id?: string;
    contract_owner_cnp?: string;

    created_at: string;
    updated_at: string;
    published_at?: string;

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
export const PROPERTY_TYPES = ['Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Business', 'Other'] as const;
export const TRANSACTION_TYPES = ['For Sale', 'For Rent', 'Hotel Regime'] as const;
export const CURRENCIES = ['EUR', 'USD', 'RON'] as const;
export const PARTITIONING_TYPES = ['Decomandat', 'Semidecomandat', 'Nedecomandat', 'Circular', 'Vagon', 'Open Space'] as const;
export const COMFORT_TYPES = ['Lux', '1', '2', '3'] as const;

export const BUILDING_TYPES = ['Apartment Block', 'Individual House', 'Duplex', 'Villa', 'Office Building', 'Mixed Use'] as const;
export const INTERIOR_CONDITIONS = ['Newly Built', 'Renovated', 'Good', 'Fair', 'Needs Renovation'] as const;
export const FURNISHING_TYPES = ['Unfurnished', 'Semi-furnished', 'Furnished', 'Luxury Furnished'] as const;

export const UNIT_FEATURES = [
    'Air Conditioning',
    'Balcony',
    'Central Heating',
    'Elevator',
    'Fireplace',
    'Garage',
    'Intercom',
    'Jacuzzi',
    'Laundry',
    'Parking',
    'Private Pool',
    'Sauna',
    'Smart Home',
    'Solar Panels',
    'Storage'
] as const;

export const COMMUNITY_FEATURES = [
    'Amphitheatre',
    'Clubhouse',
    'Common Garden',
    'Jogging Track',
    'Library',
    'Park',
    'Party Hall',
    'Playground',
    'Visitor Parking'
] as const;

export const SPORTS_FEATURES = [
    'Basketball Court',
    'Football Field',
    'Gym',
    'Squash Court',
    'Swimming Pool',
    'Tennis Court',
    'Yoga Deck'
] as const;

export const SECURITY_FEATURES = [
    '24/7 Security',
    'CCTV Surveillance',
    'Concierge',
    'Fire Safety',
    'Gated Community',
    'Video Door Phone'
] as const;

export const SUSTAINABILITY_FEATURES = [
    'Green Building',
    'Maintenance Staff',
    'Power Backup',
    'Rainwater Harvesting',
    'Sewage Treatment',
    'Solar Panels'
] as const;

export const CATEGORY_COLORS: Record<string, { bg: string, border: string, shadow: string, text: string, dot: string, filterText: string, filterBg: string, filterDot: string }> = {
    'Unit Features': { bg: 'bg-violet-600', border: 'border-violet-500', shadow: 'shadow-violet-600/20', text: 'text-violet-400', dot: 'bg-violet-500', filterText: 'text-violet-600', filterBg: 'bg-violet-50', filterDot: 'bg-violet-400' },
    'Community & Recreation': { bg: 'bg-emerald-600', border: 'border-emerald-500', shadow: 'shadow-emerald-600/20', text: 'text-emerald-400', dot: 'bg-emerald-500', filterText: 'text-emerald-600', filterBg: 'bg-emerald-50', filterDot: 'bg-emerald-400' },
    'Sports & Fitness': { bg: 'bg-orange-600', border: 'border-orange-500', shadow: 'shadow-orange-600/20', text: 'text-orange-400', dot: 'bg-orange-500', filterText: 'text-orange-600', filterBg: 'bg-orange-50', filterDot: 'bg-orange-400' },
    'Security & Safety': { bg: 'bg-red-600', border: 'border-red-500', shadow: 'shadow-red-600/20', text: 'text-red-400', dot: 'bg-red-500', filterText: 'text-red-600', filterBg: 'bg-red-50', filterDot: 'bg-red-400' },
    'Sustainability & Services': { bg: 'bg-teal-600', border: 'border-teal-500', shadow: 'shadow-teal-600/20', text: 'text-teal-400', dot: 'bg-teal-500', filterText: 'text-teal-600', filterBg: 'bg-teal-50', filterDot: 'bg-teal-400' },
    'Listing Tags': { bg: 'bg-indigo-600', border: 'border-indigo-500', shadow: 'shadow-indigo-600/20', text: 'text-indigo-400', dot: 'bg-indigo-500', filterText: 'text-indigo-600', filterBg: 'bg-indigo-50', filterDot: 'bg-indigo-400' }
};

export const LISTING_TAGS = [
    'Commission 0%',
    'Exclusive',
    'Foreclosure',
    'Hotel Regime',
    'Luxury'
] as const;

export const FEATURE_CATEGORIES = {
    'Listing Tags': LISTING_TAGS,
    'Unit Features': UNIT_FEATURES,
    'Community & Recreation': COMMUNITY_FEATURES,
    'Sports & Fitness': SPORTS_FEATURES,
    'Security & Safety': SECURITY_FEATURES,
    'Sustainability & Services': SUSTAINABILITY_FEATURES
} as const;

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

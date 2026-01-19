export interface Property {
    listingType: 'For Sale' | 'For Rent';
    currency: 'USD' | 'EUR';
    id: string;
    title: string;
    description: string;
    location: {
        address: string;
        city: string;
        state: string;
        zip: string;
        lat: number;
        lng: number;
    };
    price: number;
    specs: {
        beds: number;
        baths: number;
        sqft: number;
        lotSize?: number;
        yearBuilt: number;
        floor?: number; // For apartments
        stories?: number; // For houses
        type: 'Apartment' | 'House' | 'Land' | 'Commercial' | 'Industrial' | 'Business';
        interiorRating?: number; // 1-10 scale
    };
    features: string[]; // e.g., "Pool", "Gym", "Smart Home"
    images: string[];
    agent: {
        id: string;
        name: string;
        image: string;
        phone: string;
    };
    ownerId?: string;
    virtualTourUrl?: string; // 360 link
    valuation?: {
        estimatedPrice: number;
        confidence: number; // 0-100%
        lastUpdated: string;
    };
    isFeatured?: boolean;
}

export const MOCK_PROPERTIES: Property[] = [
    {
        id: '1',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Modern Minimalist Villa',
        description: 'A stunning architectural masterpiece featuring open-concept living, floor-to-ceiling windows, and a private infinity pool.',
        location: {
            address: '123 Palm Avenue',
            city: 'Beverly Hills',
            state: 'CA',
            zip: '90210',
            lat: 34.0736,
            lng: -118.4004
        },
        price: 5400000,
        specs: {
            beds: 4,
            baths: 5,
            sqft: 4200,
            yearBuilt: 2022,
            type: 'House',
            stories: 2,
            interiorRating: 10
        },
        features: ['Pool', 'Smart Home', 'Wine Cellar', 'Theater', 'Marble Floors', 'Designer Kitchen'],
        images: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
        ],
        agent: {
            id: 'a1',
            name: 'Sarah Broker',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 123-4567'
        },
        virtualTourUrl: 'https://example.com/tour/1',
        valuation: {
            estimatedPrice: 5350000,
            confidence: 95,
            lastUpdated: '2026-01-15'
        },
        isFeatured: true
    },
    {
        id: '2',
        listingType: 'For Rent',
        currency: 'EUR',
        title: 'Luxury Penthouse Suite',
        description: 'Top of the world living with panoramic city views, private elevator access, and premium concierge services.',
        location: {
            address: '88 Sky High Blvd',
            city: 'Paris',
            state: 'IDF',
            zip: '75001',
            lat: 48.8566,
            lng: 2.3522
        },
        price: 15000,
        specs: {
            beds: 3,
            baths: 3,
            sqft: 2800,
            floor: 45,
            yearBuilt: 2020,
            type: 'Apartment',
            interiorRating: 9
        },
        features: ['Concierge', 'Gym', 'Rooftop Terrace', 'Spa', 'Smart Home', 'Hardwood Floors'],
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
        ],
        agent: {
            id: 'a2',
            name: 'Michael Estate',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 987-6543'
        },
        valuation: {
            estimatedPrice: 15500,
            confidence: 88,
            lastUpdated: '2026-01-16'
        },
        isFeatured: true
    },
    {
        id: '3',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Central Business Tower Office',
        description: 'Premium boutique office space in the heart of the financial district. Full floor with modern amenities.',
        location: {
            address: ' financial way',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            lat: 40.7128,
            lng: -74.0060
        },
        price: 3500000,
        specs: {
            beds: 0,
            baths: 4,
            sqft: 5000,
            yearBuilt: 2019,
            type: 'Commercial',
            floor: 22,
            interiorRating: 9
        },
        features: ['Parking', 'Security', 'Fibre Internet', 'Meeting Rooms'],
        images: [
            'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a1',
            name: 'Sarah Broker',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 123-4567'
        },
        valuation: {
            estimatedPrice: 3450000,
            confidence: 92,
            lastUpdated: '2026-01-14'
        },
        isFeatured: false
    },
    {
        id: '4',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Industrial Warehouse Complex',
        description: 'Large scale distribution warehouse with high ceilings and multiple loading bays.',
        location: {
            address: '500 Logistics Way',
            city: 'Chicago',
            state: 'IL',
            zip: '60601',
            lat: 41.8781,
            lng: -87.6298
        },
        price: 8900000,
        specs: {
            beds: 0,
            baths: 2,
            sqft: 25000,
            yearBuilt: 2015,
            type: 'Industrial',
            stories: 1,
            interiorRating: 7
        },
        features: ['Loading Bays', 'High Ceilings', 'Office Space', 'Security'],
        images: [
            'https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1586528116311-ad86d790d798?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a2',
            name: 'Michael Estate',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 987-6543'
        },
        valuation: {
            estimatedPrice: 8700000,
            confidence: 85,
            lastUpdated: '2026-01-10'
        },
        isFeatured: false
    },
    {
        id: '5',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Prime Development Land',
        description: 'Large plot of land in a fast-growing residential area. Perfectly suited for a multi-unit project.',
        location: {
            address: 'Meadow Ridge Blvd',
            city: 'Portland',
            state: 'OR',
            zip: '97201',
            lat: 45.5152,
            lng: -122.6784
        },
        price: 1200000,
        specs: {
            beds: 0,
            baths: 0,
            sqft: 43560, // 1 acre
            yearBuilt: 2024,
            type: 'Land',
            interiorRating: 5
        },
        features: ['Road Access', 'Utilities Ready', 'Zoned Residential'],
        images: [
            'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1500341156681-5820131f4f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a1',
            name: 'Sarah Broker',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 123-4567'
        },
        valuation: {
            estimatedPrice: 1150000,
            confidence: 80,
            lastUpdated: '2026-01-08'
        },
        isFeatured: false
    },
    {
        id: '6',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Seaside Retreat',
        description: 'Exclusive beachfront property with private access to the ocean and panoramic sunset views.',
        location: {
            address: '45 Ocean Drive',
            city: 'Miami',
            state: 'FL',
            zip: '33109',
            lat: 25.7617,
            lng: -80.1918
        },
        price: 7500000,
        specs: {
            beds: 5,
            baths: 6,
            sqft: 5500,
            yearBuilt: 2021,
            type: 'House',
            stories: 3,
            interiorRating: 10
        },
        features: ['Private Beach', 'Infinity Pool', 'Guest House', 'Outdoor Kitchen'],
        images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a3',
            name: 'David Sun',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 321-7654'
        },
        valuation: {
            estimatedPrice: 7600000,
            confidence: 90,
            lastUpdated: '2026-01-18'
        },
        isFeatured: true
    },
    {
        id: '7',
        listingType: 'For Rent',
        currency: 'USD',
        title: 'Urban Industrial Loft',
        description: 'Converted warehouse loft with exposed brick, high ceilings, and modern finishes in the heart of the arts district.',
        location: {
            address: '77 Art Street',
            city: 'Seattle',
            state: 'WA',
            zip: '98101',
            lat: 47.6062,
            lng: -122.3321
        },
        price: 4500,
        specs: {
            beds: 1,
            baths: 2,
            sqft: 1200,
            floor: 3,
            yearBuilt: 1920,
            type: 'Apartment',
            interiorRating: 8
        },
        features: ['Exposed Brick', 'Smart Lighting', 'Roof Access', 'Pet Friendly'],
        images: [
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a2',
            name: 'Michael Estate',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 987-6543'
        },
        valuation: {
            estimatedPrice: 4600,
            confidence: 85,
            lastUpdated: '2026-01-12'
        },
        isFeatured: false
    },
    {
        id: '8',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Modern Mountain Cabin',
        description: 'Luxury ski-in/ski-out cabin with panoramic mountain views, hot tub, and cozy fireplace.',
        location: {
            address: '404 Peak Road',
            city: 'Aspen',
            state: 'CO',
            zip: '81611',
            lat: 39.1911,
            lng: -106.8175
        },
        price: 3200000,
        specs: {
            beds: 3,
            baths: 3,
            sqft: 2500,
            yearBuilt: 2018,
            type: 'House',
            stories: 2,
            interiorRating: 9
        },
        features: ['Ski Access', 'Hot Tub', 'Fireplace', 'Heated Driveway'],
        images: [
            'https://images.unsplash.com/photo-1510798831971-661eb04b3739?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a1',
            name: 'Sarah Broker',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 123-4567'
        },
        valuation: {
            estimatedPrice: 3150000,
            confidence: 92,
            lastUpdated: '2026-01-14'
        },
        isFeatured: true
    },
    {
        id: '9',
        listingType: 'For Rent',
        currency: 'USD',
        title: 'Downtown Retail Showcase',
        description: 'High-visibility corner retail space in a bustling shopping district. Ideal for luxury brands.',
        location: {
            address: '101 Commerce St',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            lat: 30.2672,
            lng: -97.7431
        },
        price: 12000,
        specs: {
            beds: 0,
            baths: 1,
            sqft: 1800,
            yearBuilt: 2010,
            type: 'Commercial',
            floor: 1,
            interiorRating: 8
        },
        features: ['Large Windows', 'High Foot Traffic', 'Storage', 'Security System'],
        images: [
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a3',
            name: 'David Sun',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 321-7654'
        },
        valuation: {
            estimatedPrice: 12500,
            confidence: 88,
            lastUpdated: '2026-01-05'
        },
        isFeatured: false
    },
    {
        id: '10',
        listingType: 'For Sale',
        currency: 'USD',
        title: 'Golden Gate View Condo',
        description: 'Elegant condo with breathtaking views of the Golden Gate Bridge. Features concierge and gym access.',
        location: {
            address: '500 Bay View',
            city: 'San Francisco',
            state: 'CA',
            zip: '94123',
            lat: 37.8018,
            lng: -122.4398
        },
        price: 2800000,
        specs: {
            beds: 2,
            baths: 2,
            sqft: 1400,
            yearBuilt: 2016,
            type: 'Apartment',
            floor: 12,
            interiorRating: 9
        },
        features: ['Bridge View', 'Concierge', 'Gym', 'Parking'],
        images: [
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80',
            'https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1770&q=80'
        ],
        agent: {
            id: 'a2',
            name: 'Michael Estate',
            image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            phone: '(555) 987-6543'
        },
        valuation: {
            estimatedPrice: 2750000,
            confidence: 94,
            lastUpdated: '2026-01-17'
        },
        isFeatured: true
    }
];

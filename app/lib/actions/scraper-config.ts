'use server';

export interface ScraperConfig {
    id: string;
    domain: string;
    name: string;
    selectors: {
        title: string;
        price: string;
        currency: string;
        location: string;
        description: string;
        images: string;
        // Specs
        rooms: string;
        area: string;
        floor: string;
    };
    isActive: boolean;
}

// Mock initial data
let mockConfigs: ScraperConfig[] = [
    {
        id: '1',
        domain: 'propertylab.ro',
        name: 'PropertyLab',
        selectors: {
            title: 'h1.entry-title',
            price: '.property-price',
            currency: '.property-price-suffix',
            location: '.property-address',
            description: '.property-description',
            images: '.property-gallery img',
            rooms: '.property-rooms',
            area: '.property-area',
            floor: '.property-floor'
        },
        isActive: true
    }
];

export async function getScraperConfigs(): Promise<ScraperConfig[]> {
    return mockConfigs;
}

export async function saveScraperConfig(config: ScraperConfig): Promise<{ success: boolean; message: string; data?: ScraperConfig }> {
    try {
        const index = mockConfigs.findIndex(c => c.id === config.id);
        if (index >= 0) {
            mockConfigs[index] = config;
        } else {
            config.id = Math.random().toString(36).substr(2, 9);
            mockConfigs.push(config);
        }
        return { success: true, message: 'Configuration saved successfully', data: config };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteScraperConfig(id: string): Promise<{ success: boolean; message: string }> {
    mockConfigs = mockConfigs.filter(c => c.id !== id);
    return { success: true, message: 'Configuration deleted' };
}

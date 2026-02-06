export interface Hotspot {
    id: string;
    pitch: number;
    yaw: number;
    type: 'scene' | 'info';
    text: string;
    targetSceneId?: string; // For 'scene' type
}

export interface Scene {
    id: string; // Unique ID for the scene (e.g. UUID or generated string)
    title: string;
    image_url: string; // URL from Supabase Storage
    hotspots: Hotspot[];
    initialViewParameters?: {
        pitch: number;
        yaw: number;
        hfov: number;
    };
}

export interface TourData {
    defaultSceneId?: string;
    scenes: Scene[];
}

export interface VirtualTour {
    id: string;
    owner_id: string;
    title: string;
    description?: string;
    property_id?: string | null;
    tour_data: TourData;
    thumbnail_url?: string | null;
    status: 'active' | 'draft';
    created_at: string;
    updated_at: string;

    // Joined fields
    property?: {
        id: string;
        title: string;
    };
    owner?: {
        full_name: string;
        email: string;
    };
}

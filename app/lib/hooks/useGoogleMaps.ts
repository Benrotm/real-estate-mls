'use client';

import { useLoadScript } from '@react-google-maps/api';

const LIBRARIES: ("places" | "drawing" | "geometry")[] = ["places", "drawing", "geometry"];

export function useGoogleMaps() {
    return useLoadScript({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
    });
}

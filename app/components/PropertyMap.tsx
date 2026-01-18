'use client';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useMemo } from 'react';

interface PropertyMapProps {
    center?: { lat: number; lng: number };
    zoom?: number;
    markers?: Array<{
        id: string;
        lat: number;
        lng: number;
        title?: string;
    }>;
    height?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 34.0736,
    lng: -118.4004
};

export default function PropertyMap({ center = defaultCenter, zoom = 10, markers = [], height = '400px' }: PropertyMapProps) {
    // Note: In a real app, the googleMapsApiKey would come from environment variables
    // For this demo, we might see "Development Purposes Only" watermark without a valid key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    return (
        <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
            <LoadScript googleMapsApiKey={apiKey}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={zoom}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {markers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={{ lat: marker.lat, lng: marker.lng }}
                            title={marker.title}
                        />
                    ))}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}

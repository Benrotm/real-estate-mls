'use client';

import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useMemo, useState, useEffect, useCallback } from 'react';

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
    propertyAddress?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 44.4268,
    lng: 26.1025
};

export default function PropertyMap({ center = defaultCenter, zoom = 10, markers = [], height = '400px', propertyAddress }: PropertyMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const [geocodedCenter, setGeocodedCenter] = useState(center);
    const [geocodedMarkers, setGeocodedMarkers] = useState(markers);

    // Geocode from address if we have one — this auto-refreshes the map pin
    const handleMapLoad = useCallback((map: google.maps.Map) => {
        if (!propertyAddress || !window.google) return;

        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: propertyAddress }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                const newCenter = { lat: loc.lat(), lng: loc.lng() };
                setGeocodedCenter(newCenter);
                setGeocodedMarkers(markers.map(m => ({
                    ...m,
                    lat: loc.lat(),
                    lng: loc.lng()
                })));
                map.panTo(newCenter);
                map.setZoom(15);
            }
        });
    }, [propertyAddress, markers]);

    return (
        <div style={{ height, width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
            <LoadScript googleMapsApiKey={apiKey}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={geocodedCenter}
                    zoom={zoom}
                    onLoad={handleMapLoad}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {geocodedMarkers.map((marker) => (
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

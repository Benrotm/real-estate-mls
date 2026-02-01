'use client';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

const LIBRARIES: ("places")[] = ["places"];

interface LocationMapProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.75rem' // rounded-xl
};

export default function LocationMap({ lat, lng, onLocationSelect }: LocationMapProps) {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
    });

    const center = useMemo(() => ({ lat, lng }), [lat, lng]);

    const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
    };

    const onMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
    };

    if (!isLoaded) return <div className="h-[400px] w-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={15}
            onClick={onMapClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
            }}
        >
            <Marker
                position={center}
                draggable={true}
                onDragEnd={onMarkerDragEnd}
                animation={google.maps.Animation.DROP}
            />
        </GoogleMap>
    );
}

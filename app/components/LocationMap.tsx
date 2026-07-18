'use client';

import { GoogleMap, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';

interface LocationMapProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number) => void;
    height?: string;
}

export default function LocationMap({ lat, lng, onLocationSelect, height }: LocationMapProps) {
    const { isLoaded } = useGoogleMaps();

    const center = useMemo(() => ({ lat, lng }), [lat, lng]);

    const containerStyle = useMemo(() => ({
        width: '100%',
        height: height || '400px',
        borderRadius: '0.75rem'
    }), [height]);

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

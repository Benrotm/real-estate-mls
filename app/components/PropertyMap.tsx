'use client';

import { GoogleMap, Marker } from '@react-google-maps/api';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Minus, RotateCw, RotateCcw, Maximize, Minimize } from 'lucide-react';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';

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
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [geocodedCenter, setGeocodedCenter] = useState(center);
    const [geocodedMarkers, setGeocodedMarkers] = useState(markers);
    const [mapTypeId, setMapTypeId] = useState('satellite');
    const [showLabels, setShowLabels] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    // Geocode from address if we have one — this auto-refreshes the map pin
    const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    useEffect(() => {
        if (!isLoaded || !map || !propertyAddress || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return;

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
                map.setZoom(19);
                map.setTilt(45);
            }
        });
    }, [isLoaded, propertyAddress, map, markers]);

    const isSatellite = mapTypeId === 'satellite' || mapTypeId === 'hybrid';
    const activeMapTypeId = isSatellite ? (showLabels ? 'hybrid' : 'satellite') : mapTypeId;

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const zoomIn = () => map && map.setZoom((map.getZoom() || 13) + 1);
    const zoomOut = () => map && map.setZoom((map.getZoom() || 13) - 1);
    const rotateLeft = () => map && map.setHeading((map.getHeading() || 0) - 90);
    const rotateRight = () => map && map.setHeading((map.getHeading() || 0) + 90);

    if (!apiKey) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-xl">Google Maps SDK Error. Map cannot load.</div>;
    }

    if (!isLoaded) {
        return <div className="p-4 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center min-h-[400px]">Loading Map...</div>;
    }

    return (
        <div ref={containerRef} style={{ position: 'relative', height: isFullscreen ? '100vh' : height, width: '100%', borderRadius: isFullscreen ? '0' : '1rem', overflow: 'hidden' }}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={geocodedCenter}
                    zoom={zoom}
                    onLoad={handleMapLoad}
                    options={{
                        mapTypeId: activeMapTypeId,
                        tilt: 45,
                        disableDefaultUI: true,
                        keyboardShortcuts: false,
                        panControl: false,
                        zoomControl: false,
                        rotateControl: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    {geocodedMarkers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={{ lat: marker.lat, lng: marker.lng }}
                            title={marker.title}
                            icon={typeof window !== 'undefined' && window.google?.maps?.Size ? {
                                url: '/premium-pin.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                            } : undefined}
                        />
                    ))}
                </GoogleMap>

            {/* Custom Top Left Controls (Map Types & Labels) */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 w-[300px]">
                <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all w-fit">
                    <button
                        onClick={() => setMapTypeId('roadmap')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-300 ${!isSatellite ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/20'}`}
                    >
                        Map
                    </button>
                    <button
                        onClick={() => setMapTypeId('satellite')}
                        className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all duration-300 ${isSatellite ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-indigo-600 hover:bg-white/20'}`}
                    >
                        Satellite
                    </button>
                    {isSatellite && (
                        <div className="flex items-center ml-2 pl-3 pr-2 border-l border-slate-200/50">
                            <label className="flex items-center text-xs font-bold text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={showLabels}
                                    onChange={(e) => setShowLabels(e.target.checked)}
                                    className="mr-2 w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                                />
                                Labels
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Right Controls (Zoom, Rotate, Fullscreen) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
                <div className="flex flex-col bg-white/40 backdrop-blur-md p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all items-center w-[44px]">
                    <button onClick={zoomIn} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-lg transition-colors" title="Zoom In">
                        <Plus className="w-5 h-5" />
                    </button>
                    <div className="h-px w-8 bg-slate-200/50" />
                    <button onClick={zoomOut} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-lg transition-colors" title="Zoom Out">
                        <Minus className="w-5 h-5" />
                    </button>
                </div>

                {isSatellite && (
                    <div className="flex flex-col bg-white/40 backdrop-blur-md p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all items-center w-[44px]">
                        <button onClick={rotateLeft} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-lg transition-colors" title="Rotate Left">
                            <RotateCcw className="w-5 h-5" />
                        </button>
                        <div className="h-px w-8 bg-slate-200/50" />
                        <button onClick={rotateRight} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-lg transition-colors" title="Rotate Right">
                            <RotateCw className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Fullscreen Control (Top Right) */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={toggleFullscreen}
                    className="p-2.5 bg-white/40 backdrop-blur-md text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all focus:outline-none w-[44px] h-[44px] flex items-center justify-center"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

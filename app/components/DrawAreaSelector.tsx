'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, DrawingManager, Polygon } from '@react-google-maps/api';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';
import { X, Check } from 'lucide-react';

interface DrawAreaSelectorProps {
    city?: string;
    value?: { lat: number; lng: number }[];
    onChange: (polygon: { lat: number; lng: number }[] | null) => void;
    onClose: () => void;
}

const defaultCenter = { lat: 45.7489, lng: 21.2087 }; // Timisoara

export default function DrawAreaSelector({ city, value, onChange, onClose }: DrawAreaSelectorProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded } = useGoogleMaps();

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(13);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const [currentPolygon, setCurrentPolygon] = useState<{lat: number, lng: number}[] | null>(value || null);
    
    // Auto-center map on city
    useEffect(() => {
        if (!isLoaded || !city || typeof window === 'undefined' || !window.google?.maps?.Geocoder) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: `${city}, Romania` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                const loc = results[0].geometry.location;
                setCenter({ lat: loc.lat(), lng: loc.lng() });
                if (map) {
                    map.panTo(loc);
                    map.setZoom(12);
                }
            }
        });
    }, [isLoaded, city, map]);

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        const path = polygon.getPath();
        const coords: {lat: number, lng: number}[] = [];
        for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coords.push({ lat: point.lat(), lng: point.lng() });
        }
        
        setCurrentPolygon(coords);
        
        // Remove the drawn polygon so we can use our own controlled <Polygon> component
        polygon.setMap(null);
    }, []);

    const handleSave = () => {
        onChange(currentPolygon);
        onClose();
    };

    const handleClear = () => {
        setCurrentPolygon(null);
    };

    if (!apiKey) return <div className="p-4 text-red-500">Google Maps SDK Error.</div>;
    if (!isLoaded) return <div className="p-4">Loading Map...</div>;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full md:max-w-[98vw] h-full md:h-[96vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Draw Area of Interest</h2>
                        <p className="text-sm text-slate-500">Draw a shape on the map to define the target area.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSave} 
                            className="px-4 py-2 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                        >
                            <Check className="w-4 h-4" />
                            Save Area
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Close">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 relative">
                    {!currentPolygon && (
                        <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[450px] bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 z-10 flex flex-col gap-1 md:gap-1.5 pointer-events-none">
                            <p className="font-bold text-orange-400 flex items-center gap-1.5 text-xs">
                                🗺️ Cum desenezi zona de interes:
                            </p>
                            <ol className="list-decimal pl-4 text-[10px] sm:text-xs text-slate-200 font-medium space-y-0.5 sm:space-y-1">
                                <li>Apasă pe hartă pentru a plasa primul punct (colț).</li>
                                <li>Continuă să apeși pentru a desena conturul zonei.</li>
                                <li>Apasă pe primul punct sau fă dublu-click pentru a termina desenul.</li>
                            </ol>
                        </div>
                    )}
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={center}
                        zoom={zoom}
                        onLoad={setMap}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                    >
                        {!currentPolygon && (
                            <DrawingManager
                                onLoad={dm => drawingManagerRef.current = dm}
                                onPolygonComplete={onPolygonComplete}
                                drawingMode={typeof window !== 'undefined' && window.google?.maps?.drawing?.OverlayType ? window.google.maps.drawing.OverlayType.POLYGON : 'polygon' as any}
                                options={{
                                    drawingControl: true,
                                    drawingControlOptions: {
                                        position: typeof window !== 'undefined' && window.google?.maps?.ControlPosition ? window.google.maps.ControlPosition.TOP_CENTER : 2,
                                        drawingModes: typeof window !== 'undefined' && window.google?.maps?.drawing?.OverlayType ? [window.google.maps.drawing.OverlayType.POLYGON] : ['polygon' as any]
                                    },
                                    polygonOptions: {
                                        fillColor: '#8B5CF6',
                                        fillOpacity: 0.2,
                                        strokeWeight: 2,
                                        strokeColor: '#8B5CF6',
                                        clickable: false,
                                        editable: true,
                                        zIndex: 1
                                    }
                                }}
                            />
                        )}

                        {currentPolygon && (
                            <Polygon
                                paths={currentPolygon}
                                options={{
                                    fillColor: '#8B5CF6',
                                    fillOpacity: 0.2,
                                    strokeWeight: 2,
                                    strokeColor: '#8B5CF6',
                                    clickable: false,
                                    editable: false,
                                    zIndex: 1
                                }}
                            />
                        )}
                    </GoogleMap>
                    
                    {currentPolygon && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">Area defined</span>
                            <button onClick={handleClear} className="text-xs text-rose-500 hover:text-rose-600 font-bold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors">
                                Clear Map
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

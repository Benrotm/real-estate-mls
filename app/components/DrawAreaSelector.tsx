'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, useLoadScript, DrawingManager, Polygon } from '@react-google-maps/api';
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
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries: ['drawing', 'geometry'] as ("drawing" | "geometry")[],
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [zoom, setZoom] = useState(13);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
    const [currentPolygon, setCurrentPolygon] = useState<{lat: number, lng: number}[] | null>(value || null);
    
    // Auto-center map on city
    useEffect(() => {
        if (!city || !window.google) return;
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
    }, [city, map]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Draw Area of Interest</h2>
                        <p className="text-sm text-slate-500">Draw a shape on the map to define the target area.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                
                <div className="flex-1 relative">
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
                                options={{
                                    drawingControl: true,
                                    drawingControlOptions: {
                                        position: window.google?.maps.ControlPosition.TOP_CENTER,
                                        drawingModes: [window.google?.maps.drawing.OverlayType.POLYGON]
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
                
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-5 py-2.5 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Save Area
                    </button>
                </div>
            </div>
        </div>
    );
}

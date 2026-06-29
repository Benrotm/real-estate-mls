'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, DrawingManager } from '@react-google-maps/api';
import Image from 'next/image';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';
import { Bed, Ruler, Navigation, MapPin } from 'lucide-react';
import { Plus, Minus, RotateCw, RotateCcw, Maximize, Minimize, MousePointer2 } from 'lucide-react';
import { Property } from '@/app/lib/properties';

interface PropertiesAreaMapProps {
    properties: Partial<Property>[];
    onFilterComplete: (filteredPropertyIds: string[], hasDrawnFilter: boolean) => void;
    onPropertySelect: (propertyId: string) => void;
    centerCity?: string;
}

const defaultCenter = {
    lat: 45.7489, // Default to Timisoara
    lng: 21.2087
};

export default function PropertiesAreaMap({ properties, onFilterComplete, onPropertySelect, centerCity }: PropertiesAreaMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [selectedProperty, setSelectedProperty] = useState<Partial<Property> | null>(null);
    const [drawnPolygon, setDrawnPolygon] = useState<google.maps.Polygon | null>(null);
    const [zoom, setZoom] = useState(13);
    const [mapTypeId, setMapTypeId] = useState('roadmap');
    const [showLabels, setShowLabels] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

    // Filter properties that actually have coordinates
    const mapProperties = properties.filter(p => p.latitude && p.longitude && !isNaN(Number(p.latitude)) && !isNaN(Number(p.longitude)));

    // Try to geocode the center city to jump the map to the right place initially
    useEffect(() => {
        if (!centerCity || !window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: `${centerCity}, Romania` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setCenter({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                });
                if (map) {
                    map.panTo(results[0].geometry.location);
                    setZoom(12);
                }
            }
        });
    }, [centerCity, map]);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Function to check which properties fall inside the drawn polygon
    const filterPropertiesInPolygon = useCallback((polygon: google.maps.Polygon) => {
        if (!window.google) return;

        const filtered = mapProperties.filter(property => {
            if (!property.latitude || !property.longitude) return false;
            const position = new window.google.maps.LatLng(Number(property.latitude), Number(property.longitude));
            return window.google.maps.geometry.poly.containsLocation(position, polygon);
        });

        const ids = filtered.map(p => p.id).filter((id): id is string => Boolean(id));
        onFilterComplete(ids, true);
    }, [mapProperties, onFilterComplete]);

    const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
        // Remove existing polygon if one is already drawn to keep only 1 active filter shape
        if (drawnPolygon) {
            drawnPolygon.setMap(null);
        }

        polygon.setOptions({
            fillColor: '#8B5CF6',
            fillOpacity: 0.15,
            strokeWeight: 2,
            strokeColor: '#8B5CF6',
            clickable: false,
            editable: true,
            zIndex: 1
        });

        // Add listeners to re-filter if the user drags or edits the polygon shape
        window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => filterPropertiesInPolygon(polygon));
        window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => filterPropertiesInPolygon(polygon));

        setDrawnPolygon(polygon);
        filterPropertiesInPolygon(polygon);

        // Hide drawing controls after drawing one shape to avoid clutter
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }

    }, [drawnPolygon, filterPropertiesInPolygon]);

    // Clear the drawn shape
    const clearDrawing = () => {
        if (drawnPolygon) {
            drawnPolygon.setMap(null);
            setDrawnPolygon(null);
            onFilterComplete([], false);
        }
    };

    if (!apiKey) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-xl">Google Maps SDK Error. Map cannot load.</div>;
    }

    if (!isLoaded) {
        return <div className="p-4 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center min-h-[400px]">Loading Map...</div>;
    }

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

    const formatPrice = (price?: number | null, currency = 'EUR') => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${isFullscreen ? 'h-[100vh]' : 'h-[600px]'} ${isFullscreen ? 'rounded-none' : 'rounded-2xl'} overflow-hidden shadow-sm border border-slate-200 bg-slate-100`}>
            {drawnPolygon && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 text-sm font-bold">
                    <span>Area Filter Active</span>
                    <button
                        onClick={clearDrawing}
                        className="p-1 hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center group"
                        title="Clear map filter"
                    >
                        <span className="sr-only">Clear Filter</span>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            )}

            <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={center}
                    zoom={zoom}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={() => setSelectedProperty(null)}
                    options={{
                        disableDefaultUI: true,
                        mapTypeId: activeMapTypeId
                    }}
                >
                    <DrawingManager
                        onLoad={dm => drawingManagerRef.current = dm}
                        onPolygonComplete={onPolygonComplete}
                        options={{
                            drawingControl: false,
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

                    {mapProperties.map((property) => (
                        <Marker
                            key={property.id}
                            position={{ lat: Number(property.latitude), lng: Number(property.longitude) }}
                            onClick={() => setSelectedProperty(property)}
                            icon={window.google ? {
                                url: '/premium-pin.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                            } : undefined}
                        />
                    ))}

                    {selectedProperty && (
                        <InfoWindow
                            position={{ lat: Number(selectedProperty.latitude), lng: Number(selectedProperty.longitude) }}
                            onCloseClick={() => setSelectedProperty(null)}
                            options={{ maxWidth: 320 }}
                        >
                            <div
                                onClick={() => selectedProperty.id && onPropertySelect(selectedProperty.id)}
                                className="block group cursor-pointer w-64 text-left"
                            >
                                <div className="relative h-32 w-full rounded-t-lg overflow-hidden">
                                    <Image
                                        src={selectedProperty.images?.[0] || '/placeholder-property.jpg'}
                                        alt={selectedProperty.title || 'Property'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className={`absolute top-2 left-2 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-sm ${selectedProperty.listing_type === 'For Rent' ? 'bg-blue-600' : 'bg-rose-500'}`}>
                                        {selectedProperty.listing_type?.toUpperCase()}
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-md">
                                        {formatPrice(selectedProperty.price, selectedProperty.currency)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-b-lg border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1 group-hover:text-blue-600 transition-colors">
                                        {selectedProperty.title}
                                    </h4>
                                    <p className="text-slate-500 text-[10px] flex items-center mb-2 line-clamp-1">
                                        <MapPin className="w-3 h-3 mr-1 shrink-0" />
                                        {selectedProperty.location_city}{selectedProperty.location_area ? `, ${selectedProperty.location_area}` : ''}
                                    </p>
                                    <div className="flex gap-3 text-slate-600 border-t border-slate-50 pt-2">
                                        {selectedProperty.rooms && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold">
                                                <Bed className="w-3 h-3 text-slate-400" /> {selectedProperty.rooms} rooms
                                            </div>
                                        )}
                                        {selectedProperty.area_usable && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold">
                                                <Ruler className="w-3 h-3 text-slate-400" /> {selectedProperty.area_usable} m²
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

            {/* Custom Top Left Controls (Map Types & Labels) */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 w-[300px]">
                <div className={`flex bg-white/40 backdrop-blur-md p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all w-fit pointer-events-auto items-center`}>
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

                    <div className="h-4 w-px bg-slate-200/50 mx-1" />

                    <button
                        onClick={() => drawingManagerRef.current?.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-white/20 rounded-lg transition-all"
                    >
                        <MousePointer2 className="w-4 h-4" />
                        <span>Select Area</span>
                    </button>

                    {isSatellite && (
                        <div className="flex items-center ml-1 pl-3 pr-2 border-l border-slate-200/50">
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
            <div className={`absolute ${isFullscreen ? 'right-4' : 'right-4'} top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10`}>
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

            {/* Fullscreen Control (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-10">
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

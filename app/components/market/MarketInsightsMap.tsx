'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, DrawingManager } from '@react-google-maps/api';
import Image from 'next/image';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';
import { Bed, Ruler, TrendingUp, TrendingDown, X } from 'lucide-react';
import { Plus, Minus, RotateCw, RotateCcw, Maximize, Minimize, MousePointer2 } from 'lucide-react';

interface MarketInsightsMapProps {
    properties: any[];
    onFilterComplete: (filteredProperties: any[], hasDrawnFilter: boolean) => void;
    onPropertySelect: (propertyId: string) => void;
    centerCity?: string;
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 45.7489, // Default to Timisoara
    lng: 21.2087
};

export default function MarketInsightsMap({ properties, onFilterComplete, onPropertySelect, centerCity }: MarketInsightsMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
    const [drawnOverlay, setDrawnOverlay] = useState<any | null>(null);
    const [mapTypeId, setMapTypeId] = useState('roadmap');
    const [showLabels, setShowLabels] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);

    // Filter valid markers (must have lat/lng)
    const validMarkers = properties.filter(
        item => item.properties?.latitude != null && item.properties?.longitude != null
    );

    // Geocode center city if provided
    useEffect(() => {
        if (!isLoaded || !centerCity || !window.google || !window.google.maps) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: `${centerCity}, Romania` }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setCenter({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                });
                if (map) {
                    map.panTo(results[0].geometry.location);
                    map.setZoom(13); // Zoom into the city
                }
            }
        });
    }, [isLoaded, centerCity, map]);

    const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
        setMap(mapInstance);

        // Auto-fit bounds if we have markers and no explicit drawn overlay yet
        if (validMarkers.length > 0 && mapInstance && !drawnOverlay && !centerCity) {
            // We can do this optionally, or just rely on the center
            const bounds = new window.google.maps.LatLngBounds();
            validMarkers.forEach(v => {
                bounds.extend({ lat: v.properties.latitude, lng: v.properties.longitude });
            });
            mapInstance.fitBounds(bounds);
        }
    }, [validMarkers, drawnOverlay, centerCity]);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    const onOverlayComplete = (e: google.maps.drawing.OverlayCompleteEvent) => {
        // Remove previous overlay if exists
        if (drawnOverlay) {
            drawnOverlay.setMap(null);
        }

        const newOverlay = e.overlay;
        setDrawnOverlay(newOverlay);

        // Switch drawing manager back to pan mode (null)
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(null);
        }

        filterPropertiesByOverlay(newOverlay);
    };

    const filterPropertiesByOverlay = (overlay: any) => {
        if (!window.google) return;

        let filtered = [];

        if (overlay instanceof window.google.maps.Polygon) {
            const polygon = overlay as google.maps.Polygon;
            filtered = properties.filter(item => {
                const prop = item.properties;
                if (!prop || prop.latitude == null || prop.longitude == null) return false;
                const point = new window.google.maps.LatLng(prop.latitude, prop.longitude);
                return window.google.maps.geometry.poly.containsLocation(point, polygon);
            });
        } else if (overlay instanceof window.google.maps.Circle) {
            const circle = overlay as google.maps.Circle;
            const center = circle.getCenter();
            const radius = circle.getRadius();
            filtered = properties.filter(item => {
                const prop = item.properties;
                if (!prop || prop.latitude == null || prop.longitude == null || !center) return false;
                const point = new window.google.maps.LatLng(prop.latitude, prop.longitude);
                const distance = window.google.maps.geometry.spherical.computeDistanceBetween(center, point);
                return distance <= radius;
            });
        } else if (overlay instanceof window.google.maps.Rectangle) {
            const rectangle = overlay as google.maps.Rectangle;
            const bounds = rectangle.getBounds();
            filtered = properties.filter(item => {
                const prop = item.properties;
                if (!prop || prop.latitude == null || prop.longitude == null || !bounds) return false;
                const point = new window.google.maps.LatLng(prop.latitude, prop.longitude);
                return bounds.contains(point);
            });
        } else {
            // Unhandled overlay type
            filtered = properties;
        }

        onFilterComplete(filtered, true);
    };

    const handleClearDraw = () => {
        if (drawnOverlay) {
            drawnOverlay.setMap(null);
            setDrawnOverlay(null);
        }
        setSelectedProperty(null);
        onFilterComplete(properties, false); // Pass original properties back
    };

    const formatPrice = (price: number, currency = 'EUR') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const calculatePriceDiff = (sold: number, listed: number) => {
        if (!listed) return null;
        const diff = ((sold - listed) / listed) * 100;
        return {
            percent: Math.abs(diff).toFixed(1),
            isUp: diff > 0,
            value: sold - listed
        };
    };

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
        <div ref={containerRef} className={`relative w-full ${isFullscreen ? 'h-[100vh]' : 'h-[600px]'} ${isFullscreen ? 'rounded-none' : 'rounded-2xl'} bg-slate-100 overflow-hidden shadow-inner border border-slate-200`}>
            {drawnOverlay && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={handleClearDraw}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold shadow-xl hover:bg-slate-800 transition-all hover:scale-105"
                    >
                        <span>Area Filter Active</span>
                        <X className="w-4 h-4 text-slate-300 hover:text-white" />
                    </button>
                </div>
            )}

            <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={12}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        disableDefaultUI: true,
                        mapTypeId: activeMapTypeId,
                        mapId: 'ab5a30f3aa5fcf' // Optional custom map styling ID
                    }}
                >
                    <DrawingManager
                        onLoad={(dm) => { drawingManagerRef.current = dm; }}
                        onOverlayComplete={onOverlayComplete}
                        options={{
                            drawingControl: false,
                            polygonOptions: {
                                fillColor: '#8b5cf6',
                                fillOpacity: 0.2,
                                strokeColor: '#8b5cf6',
                                strokeWeight: 2,
                                clickable: false,
                                editable: true,
                                zIndex: 1
                            },
                            circleOptions: {
                                fillColor: '#8b5cf6',
                                fillOpacity: 0.2,
                                strokeColor: '#8b5cf6',
                                strokeWeight: 2,
                                clickable: false,
                                editable: true,
                                zIndex: 1
                            },
                            rectangleOptions: {
                                fillColor: '#8b5cf6',
                                fillOpacity: 0.2,
                                strokeColor: '#8b5cf6',
                                strokeWeight: 2,
                                clickable: false,
                                editable: true,
                                zIndex: 1
                            }
                        }}
                    />

                    {validMarkers.map((item) => (
                        <Marker
                            key={item.id}
                            position={{ lat: item.properties.latitude, lng: item.properties.longitude }}
                            onClick={() => setSelectedProperty(item)}
                            title={item.properties.title}
                            icon={typeof window !== 'undefined' && window.google?.maps?.Size ? {
                                url: '/premium-pin.png',
                                scaledSize: new window.google.maps.Size(40, 40)
                            } : undefined}
                        />
                    ))}

                    {selectedProperty && (
                        <InfoWindow
                            position={{
                                lat: selectedProperty.properties.latitude,
                                lng: selectedProperty.properties.longitude
                            }}
                            onCloseClick={() => setSelectedProperty(null)}
                            options={{ maxWidth: 320 }}
                        >
                            <div
                                onClick={() => onPropertySelect(selectedProperty.properties.id)}
                                className="block group cursor-pointer w-64 text-left"
                            >
                                <div className="relative h-32 w-full rounded-t-lg overflow-hidden">
                                    <Image
                                        src={selectedProperty.properties.images?.[0] || '/placeholder-property.jpg'}
                                        alt={selectedProperty.properties.title || 'Property'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                        SOLD
                                    </div>
                                </div>
                                <div className="p-3 bg-white rounded-b-lg">
                                    <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-1 group-hover:text-violet-600 transition-colors">
                                        {selectedProperty.properties.title}
                                    </h4>

                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Sold Price</p>
                                            <p className="font-black text-slate-900">{formatPrice(selectedProperty.sold_price, selectedProperty.properties.currency)}</p>
                                        </div>
                                        {(() => {
                                            const diff = calculatePriceDiff(selectedProperty.sold_price, selectedProperty.properties.price);
                                            if (!diff) return null;
                                            return (
                                                <div className={`flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md ${diff.isUp ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {diff.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {diff.percent}%
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="flex items-center gap-3 text-slate-500 border-t border-slate-100 pt-2">
                                        <div className="flex items-center gap-1 text-[10px] font-bold">
                                            <Bed className="w-3 h-3 text-slate-400" /> {selectedProperty.properties.rooms} rooms
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold">
                                            <Ruler className="w-3 h-3 text-slate-400" /> {selectedProperty.properties.area_usable} m²
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>

            {/* Custom Top Left Controls (Map Types & Labels) */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 w-fit">
                <div className="flex bg-white/40 backdrop-blur-md p-1 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all w-fit items-center">
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

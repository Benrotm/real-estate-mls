'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Property } from '@/app/lib/properties';
import { getMapProperties } from '@/app/lib/actions/properties';
import { LayoutGrid, MapIcon, Loader2, Search } from 'lucide-react';
import PropertiesAreaMap from './PropertiesAreaMap';
import PropertyCard from '@/app/components/PropertyCard';
import PropertyModal from '../market/PropertyModal';
import PropertySortToggle from '@/app/components/PropertySortToggle';
import PerPageSelector from '@/app/components/PerPageSelector';

interface PropertiesClientViewProps {
    initialProperties: Property[];
    totalCount: number;
    makeOfferAccessMap: Record<string, boolean>;
    paginationParams: any; // Using this to trigger map refetch if filters change
    children: React.ReactNode; // The SSR pagination and grid
}

export default function PropertiesClientView({
    initialProperties,
    totalCount,
    makeOfferAccessMap,
    paginationParams,
    children
}: PropertiesClientViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [mapProperties, setMapProperties] = useState<Partial<Property>[]>([]);
    const [isLoadingMap, setIsLoadingMap] = useState(false);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const [mapParamsStr, setMapParamsStr] = useState('');

    // Determine if user has actively applied any filter (ignoring pagination and sort parameters)
    const activeFilterKeys = ['listing_type', 'type', 'minPrice', 'maxPrice', 'keywords', 'location_county', 'city', 'location_city', 'location_area', 'rooms'];
    const hasActiveFilters = activeFilterKeys.some(key => paginationParams?.[key] && String(paginationParams[key]).trim() !== '');

    // Fetch up to 500 properties for the map when map mode is activated or filters change
    useEffect(() => {
        if (viewMode === 'map') {
            // Strip out pagination and drawn filter to get base results for the map pins
            const mapParams = { ...paginationParams };
            delete mapParams.drawn_ids;
            delete mapParams.page;
            delete mapParams.per_page;

            const newParamsStr = JSON.stringify(mapParams);

            // Only re-fetch pins if base search filters changed
            if (newParamsStr !== mapParamsStr) {
                const fetchMapData = async () => {
                    if (!hasActiveFilters) {
                        setMapProperties([]);
                        return; // Defer loading until filters are applied
                    }

                    setIsLoadingMap(true);
                    try {
                        const data = await getMapProperties(mapParams);
                        setMapProperties(data);
                        setMapParamsStr(newParamsStr);
                    } catch (error) {
                        console.error("Failed to load map properties:", error);
                    } finally {
                        setIsLoadingMap(false);
                    }
                };
                fetchMapData();
            }
        }
    }, [viewMode, paginationParams, mapParamsStr]);

    // Render property card function removed because we use {children} to render the grid now.

    return (
        <div className="w-full">
            {selectedPropertyId && (
                <PropertyModal
                    propertyId={selectedPropertyId}
                    onClose={() => setSelectedPropertyId(null)}
                />
            )}

            {/* View Toggle Header */}
            <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <span className="font-bold text-slate-700 order-1">
                    {viewMode === 'map' && searchParams.has('drawn_ids')
                        ? `${totalCount} Properties in Area`
                        : `${totalCount} Properties Found`}
                </span>
                <div className="flex items-center gap-4 flex-wrap justify-center order-3 md:order-2">
                    <PropertySortToggle />
                    <PerPageSelector currentValue={Math.min(parseInt(paginationParams?.per_page) || 15, 50)} />
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm ml-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-bold tracking-wide uppercase ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Grid
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 text-sm font-bold tracking-wide uppercase ${viewMode === 'map' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <MapIcon className="w-4 h-4" />
                            Map View
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'grid' ? (
                // Render the Server-Side Rendered children (Pagination + Grid)
                <div className="animate-in fade-in duration-300">
                    {children}
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Map Box */}
                    <div className="w-full relative">
                        {isLoadingMap && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-100">
                                <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
                                <p className="text-slate-700 font-bold uppercase tracking-widest text-sm">Loading Map Data...</p>
                            </div>
                        )}
                        {!isLoadingMap && !hasActiveFilters && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/60 backdrop-blur-md rounded-2xl">
                                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center border border-slate-200 max-w-sm mx-4 transform transition-all scale-100">
                                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-violet-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">Apply Filters to View Map</h3>
                                    <p className="text-sm text-slate-500 font-medium">Search for a city, property type, or price range to load pins on the map.</p>
                                </div>
                            </div>
                        )}
                        {!isLoadingMap && hasActiveFilters && mapProperties.length === 0 && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm rounded-2xl">
                                <div className="bg-white p-6 rounded-2xl shadow-xl text-center border border-slate-200">
                                    <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <h3 className="text-lg font-bold text-slate-900">No Properties Found</h3>
                                    <p className="text-sm text-slate-500">Adjust your filters to see map results.</p>
                                </div>
                            </div>
                        )}
                        <PropertiesAreaMap
                            properties={mapProperties}
                            centerCity={paginationParams.location_city || paginationParams.city || 'Timisoara'}
                            onPropertySelect={(id) => setSelectedPropertyId(id)}
                            onFilterComplete={(filteredIds, hasFilter) => {
                                const params = new URLSearchParams(searchParams.toString());
                                if (hasFilter) {
                                    if (filteredIds.length > 0) {
                                        params.set('drawn_ids', filteredIds.join(','));
                                    } else {
                                        params.set('drawn_ids', 'none'); // Magic string for 0 properties
                                    }
                                    params.delete('page');
                                } else {
                                    params.delete('drawn_ids');
                                    params.delete('page');
                                }
                                router.push(`/properties?${params.toString()}`, { scroll: false });
                            }}
                        />
                    </div>

                    {/* Filtered SSR Properties Display (Pagination preserved) */}
                    <div className="pt-4 transition-all pb-12">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
}

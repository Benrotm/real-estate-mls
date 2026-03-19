'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign, TrendingDown, TrendingUp, Calendar, Bed, Ruler, LayoutGrid, List as ListIcon, Loader2, Home, Map as MapIcon, Layers } from 'lucide-react';
import { getSoldProperties } from '@/app/lib/actions/valuation';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MarketInsightsMap from './MarketInsightsMap';
import PropertyModal from './PropertyModal';
import Pagination from '@/app/components/Pagination';
import PerPageSelector from '@/app/components/PerPageSelector';

const PROPERTY_TYPES = ['All', 'Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Investment', 'Business', 'Other'];

export default function MarketInsightsClient({ basePath = '/dashboard/admin/market' }: { basePath?: string }) {
    const searchParams = useSearchParams();
    
    // Get pagination from URL
    const currentPage = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '50'), 50);

    const [filters, setFilters] = useState({
        city: '',
        area: '',
        type: 'All',
        minRooms: '',
        maxRooms: '',
        minPrice: '',
        maxPrice: '',
        minArea: '',
        maxArea: '',
        yearBuilt: ''
    });
    const [soldProperties, setSoldProperties] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [mapFilteredProperties, setMapFilteredProperties] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getSoldProperties({
                city: filters.city || undefined,
                area: filters.area || undefined,
                type: filters.type === 'All' ? undefined : filters.type,
                minRooms: filters.minRooms ? parseInt(filters.minRooms) : undefined,
                maxRooms: filters.maxRooms ? parseInt(filters.maxRooms) : undefined,
                minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
                minArea: filters.minArea ? parseInt(filters.minArea) : undefined,
                maxArea: filters.maxArea ? parseInt(filters.maxArea) : undefined,
                yearBuilt: filters.yearBuilt ? parseInt(filters.yearBuilt) : undefined,
            }, currentPage, perPage);
            
            setSoldProperties(res.data);
            setTotalCount(res.totalCount);
            setMapFilteredProperties(null); // Reset map filter when fetching new data
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters.city, filters.area, filters.type, filters.minRooms, filters.maxRooms, filters.minPrice, filters.maxPrice, filters.minArea, filters.maxArea, filters.yearBuilt, currentPage, perPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const formatPrice = (price: any, currency = 'EUR') => {
        if (price === null || price === undefined || isNaN(price)) return 'N/A';
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

    const calculateDaysOnMarket = (item: any) => {
        if (item.days_on_market !== null && item.days_on_market !== undefined) {
            return item.days_on_market;
        }
        if (item.sold_date && item.properties?.created_at) {
            const sold = new Date(item.sold_date);
            const created = new Date(item.properties.created_at);
            return Math.floor((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        }
        return null;
    };

    const displayedProperties = mapFilteredProperties !== null ? mapFilteredProperties : soldProperties;

    return (
        <div className="space-y-8">
            {selectedPropertyId && (
                <PropertyModal
                    propertyId={selectedPropertyId}
                    onClose={() => setSelectedPropertyId(null)}
                />
            )}

            {/* Search Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <form onSubmit={handleSearch} className="relative space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="City (e.g. Timisoara)"
                                value={filters.city}
                                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder-slate-400 font-medium"
                            />
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Neighborhood / Area"
                                value={filters.area}
                                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder-slate-400 font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Search className="w-5 h-5" /> Search Sold
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4 border-t border-slate-100">
                        {/* Type Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Home className="w-3 h-3 text-violet-500" /> Property Type
                            </label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                            >
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3 text-emerald-500" /> Price Range (€)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                        {/* Area Range */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Ruler className="w-3 h-3 text-blue-500" /> Area Range (m²)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minArea}
                                    onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxArea}
                                    onChange={(e) => setFilters({ ...filters, maxArea: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                        {/* Layout / Rooms */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Bed className="w-3 h-3 text-orange-500" /> Rooms
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minRooms}
                                    onChange={(e) => setFilters({ ...filters, minRooms: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                                <span className="text-slate-300">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxRooms}
                                    onChange={(e) => setFilters({ ...filters, maxRooms: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                                />
                            </div>
                        </div>

                        {/* Year Built */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-cyan-500" /> Year Built
                            </label>
                            <input
                                type="number"
                                placeholder="e.g. 2020"
                                value={filters.yearBuilt}
                                onChange={(e) => setFilters({ ...filters, yearBuilt: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500 outline-none font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{totalCount} Properties Found</p>
                            <PerPageSelector currentValue={perPage} basePath={basePath} />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('map')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <MapIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Results Grid/List/Map */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Analyzing market data...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Map View Box */}
                    {viewMode === 'map' && (
                        <div className="w-full relative">
                            {soldProperties.length === 0 && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm rounded-2xl">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center border border-slate-200">
                                        <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <h3 className="text-lg font-bold text-slate-900">No Properties Found</h3>
                                        <p className="text-sm text-slate-500">Adjust the filters above.</p>
                                    </div>
                                </div>
                            )}
                            <MarketInsightsMap
                                properties={soldProperties}
                                centerCity={filters.city}
                                onPropertySelect={(id) => setSelectedPropertyId(id)}
                                onFilterComplete={(filtered, hasFilter) => {
                                    if (hasFilter) {
                                        setMapFilteredProperties(filtered);
                                    } else {
                                        setMapFilteredProperties(null);
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* Properties Display (Grid/List) */}
                    {displayedProperties.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Sold Properties Found</h3>
                            <p className="text-slate-500 font-medium">Try adjusting your filters or area.</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'list' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                            {displayedProperties.map((item) => {
                                const prop = item.properties;
                                const diff = calculatePriceDiff(item.sold_price, prop?.price);
                                const dom = calculateDaysOnMarket(item);

                                return (
                                    <Link href={`/properties/${prop?.id}`} key={item.id} className={`block bg-white cursor-pointer border border-slate-100 rounded-2xl overflow-hidden group hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-900/5 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${viewMode === 'list' ? 'flex items-center gap-6 p-4' : ''}`}>
                                        {/* Image */}
                                        <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-32 rounded-xl shrink-0' : 'h-48 w-full'}`}>
                                            <Image
                                                src={prop?.images?.[0] || '/placeholder-property.jpg'}
                                                alt={prop?.title || 'Property'}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">
                                                SOLD
                                            </div>
                                            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                                                {prop?.type}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className={`p-5 flex-1 ${viewMode === 'list' ? 'p-0' : ''}`}>
                                            <h4 className="font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-600 transition-colors text-lg">{prop?.title}</h4>
                                            <div className="flex items-center text-slate-400 text-xs mb-4 font-medium">
                                                <MapPin className="w-3 h-3 mr-1 text-slate-300" />
                                                {prop?.location_city}{prop?.location_area ? `, ${prop.location_area}` : ''}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Listing Price</p>
                                                    <p className="text-sm text-slate-500 line-through decoration-slate-300 font-bold">{formatPrice(prop?.price, prop?.currency)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1">Sold Price</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-xl font-black text-slate-950">{formatPrice(item.sold_price, prop?.currency)}</p>
                                                        {prop?.area_usable > 0 && (
                                                            <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                ({formatPrice(Math.round(item.sold_price / prop.area_usable), prop.currency)}/m²)
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                <div className="flex gap-3 text-slate-500 overflow-hidden">
                                                    <div className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap">
                                                        <Bed className="w-3 h-3 text-slate-400" /> {prop?.rooms} rooms
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap">
                                                        <Ruler className="w-3 h-3 text-slate-400" /> {prop?.area_usable} m²
                                                    </div>
                                                    {(prop?.floor !== undefined && prop?.floor !== null || prop?.total_floors !== undefined && prop?.total_floors !== null) && (
                                                        <div className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap">
                                                            <Layers className="w-3 h-3 text-slate-400" /> 
                                                            {(prop?.floor !== undefined && prop?.floor !== null && prop?.total_floors !== undefined && prop?.total_floors !== null) 
                                                                ? `${prop.floor}/${prop.total_floors}` 
                                                                : (prop?.floor !== undefined && prop?.floor !== null ? prop.floor : prop?.total_floors)}
                                                        </div>
                                                    )}
                                                </div>

                                                {diff && (
                                                    <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${diff.isUp ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                        {diff.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                        {diff.percent}% vs List
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-between">
                                                {dom !== null && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-violet-600 font-black uppercase tracking-wide bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                                                        <TrendingDown className="w-3 h-3" />
                                                        {dom} Days on Market
                                                    </div>
                                                )}
                                                {prop?.year_built && (
                                                    <span className="text-[10px] text-slate-400 font-bold">Built in {prop.year_built}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    <div className="pt-8 border-t border-slate-100">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(totalCount / perPage)}
                            basePath={basePath}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

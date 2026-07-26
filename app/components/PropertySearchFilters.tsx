'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DrawAreaSelector from '@/app/components/DrawAreaSelector';
import { PROPERTY_TYPES, TRANSACTION_TYPES, COMFORT_TYPES, PARTITIONING_TYPES, PROPERTY_FEATURES, INTERIOR_CONDITIONS, FURNISHING_TYPES, FEATURE_CATEGORIES, CATEGORY_COLORS } from '@/app/lib/properties';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, Home, Banknote, Phone, MapPin, Map, Building2 } from 'lucide-react';
import { saveSearch } from '@/app/lib/actions/savedSearches';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';
import { TIMISOARA_AREAS, formatCityList, cleanCityName } from '@/app/lib/constants/locations';
import MultiSearchableSelect from '@/app/components/MultiSearchableSelect';

export default function PropertySearchFilters({ basePath = '/properties', isAdmin = false, defaultCollapsed = true }: { basePath?: string; isAdmin?: boolean; defaultCollapsed?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Collapsible state
    const [isMainExpanded, setIsMainExpanded] = useState(!defaultCollapsed);
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const [showAmenities, setShowAmenities] = useState(false);
    const [showAreaMap, setShowAreaMap] = useState(false);

    // System locations state
    const [systemCities, setSystemCities] = useState<any[]>([]);
    const [systemCounties, setSystemCounties] = useState<any[]>([]);
    const [systemAreas, setSystemAreas] = useState<any[]>([]);

    useEffect(() => {
        async function loadLocations() {
            try {
                const res = await getSystemLocations();
                if (res && res.cities) {
                    setSystemCities(res.cities);
                    setSystemCounties(res.counties || []);
                    setSystemAreas(res.areas || []);
                }
            } catch (err) {
                console.error("Failed to fetch system locations in PropertySearchFilters:", err);
            }
        }
        loadLocations();
    }, []);

    // Initialize state from URL params
    const initialFeatures = searchParams.getAll('features');

    const [filters, setFilters] = useState({
        keywords: searchParams.get('keywords') || '',
        listing_type: searchParams.get('listing_type') || '',
        type: searchParams.get('type') || '',
        location_county: searchParams.get('location_county') || '',
        location_city: searchParams.get('location_city') || '',
        location_area: searchParams.get('location_area') || '',
        location_polygon: searchParams.get('location_polygon') ? JSON.parse(searchParams.get('location_polygon')!) : null,
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        rooms: searchParams.get('rooms') || '',
        area: searchParams.get('area') || '',
        bathrooms: searchParams.get('bathrooms') || '',
        year_built: searchParams.get('year_built') || '',
        floor: searchParams.get('floor') || '',
        partitioning: searchParams.get('partitioning') || '',
        comfort: searchParams.get('comfort') || '',
        building_type: searchParams.get('building_type') || '',
        interior_condition: searchParams.get('interior_condition') || '',
        furnishing: searchParams.get('furnishing') || '',
        has_video: searchParams.get('has_video') === 'true',
        has_virtual_tour: searchParams.get('has_virtual_tour') === 'true',
        commission_0: searchParams.get('commission_0') === 'true',
        exclusive: searchParams.get('exclusive') === 'true',
        luxury: searchParams.get('luxury') === 'true',
        hotel_regime: searchParams.get('hotel_regime') === 'true',
        foreclosure: searchParams.get('foreclosure') === 'true',
        owner_phone: searchParams.get('owner_phone') || '',
        features: initialFeatures
    });

    const activeFilterPills = useMemo(() => {
        const pills: string[] = [];
        if (filters.keywords) pills.push(`"${filters.keywords}"`);
        if (filters.type) pills.push(filters.type);
        if (filters.listing_type) pills.push(filters.listing_type);
        if (filters.location_city) pills.push(filters.location_city);
        if (filters.location_area) pills.push(filters.location_area);
        if (filters.minPrice && filters.maxPrice) pills.push(`€${filters.minPrice} - €${filters.maxPrice}`);
        else if (filters.minPrice) pills.push(`Min €${filters.minPrice}`);
        else if (filters.maxPrice) pills.push(`Max €${filters.maxPrice}`);
        if (filters.rooms) pills.push(`${filters.rooms}+ Rooms`);
        if (filters.area) pills.push(`Min ${filters.area} m²`);
        if (filters.features && filters.features.length > 0) pills.push(`${filters.features.length} features`);
        return pills;
    }, [filters]);

    const citiesOptions = useMemo(() => {
        if (!systemCities.length) return ['Timișoara', 'Arad', 'Cluj-Napoca', 'București', 'Oradea'];
        return formatCityList(systemCities, systemCounties);
    }, [systemCities, systemCounties]);

    const areasOptions = useMemo(() => {
        let baseList: string[] = [];
        if (!filters.location_city) {
            baseList = systemAreas.length ? Array.from(new Set(systemAreas.map(a => a.name))).sort((a, b) => a.localeCompare(b, 'ro')) : TIMISOARA_AREAS;
        } else {
            const cleanSel = cleanCityName(filters.location_city).toLowerCase();
            const cityMatch = systemCities.find(c => cleanCityName(c.name).toLowerCase() === cleanSel || c.name.toLowerCase() === cleanSel);
            if (cityMatch) {
                const childAreas = systemAreas.filter(a => a.parent_id === cityMatch.id).map(a => a.name).sort((a, b) => a.localeCompare(b, 'ro'));
                if (childAreas.length) baseList = childAreas;
            }
            if (!baseList.length) {
                if (cleanSel.includes('timisoara')) baseList = TIMISOARA_AREAS;
                else baseList = Array.from(new Set(systemAreas.map(a => a.name))).sort((a, b) => a.localeCompare(b, 'ro'));
            }
        }
        return ['No Area Completed', ...baseList];
    }, [filters.location_city, systemCities, systemAreas]);

    // Check if sections have active filters for badges
    const hasActiveDetails =
        filters.partitioning || filters.comfort || filters.year_built || filters.floor ||
        filters.building_type || filters.interior_condition || filters.furnishing ||
        filters.has_video || filters.has_virtual_tour || filters.commission_0 ||
        filters.exclusive || filters.luxury || filters.foreclosure;

    const hasActiveAmenities = filters.features && filters.features.length > 0;

    // Sync state with URL params
    useEffect(() => {
        setFilters({
            keywords: searchParams.get('keywords') || '',
            listing_type: searchParams.get('listing_type') || '',
            type: searchParams.get('type') || '',
            location_county: searchParams.get('location_county') || '',
            location_city: searchParams.get('location_city') || '',
            location_area: searchParams.get('location_area') || '',
            location_polygon: searchParams.get('location_polygon') ? JSON.parse(searchParams.get('location_polygon')!) : null,
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            rooms: searchParams.get('rooms') || '',
            area: searchParams.get('area') || '',
            bathrooms: searchParams.get('bathrooms') || '',
            year_built: searchParams.get('year_built') || '',
            floor: searchParams.get('floor') || '',
            partitioning: searchParams.get('partitioning') || '',
            comfort: searchParams.get('comfort') || '',
            building_type: searchParams.get('building_type') || '',
            interior_condition: searchParams.get('interior_condition') || '',
            furnishing: searchParams.get('furnishing') || '',
            has_video: searchParams.get('has_video') === 'true',
            has_virtual_tour: searchParams.get('has_virtual_tour') === 'true',
            commission_0: searchParams.get('commission_0') === 'true',
            exclusive: searchParams.get('exclusive') === 'true',
            luxury: searchParams.get('luxury') === 'true',
            hotel_regime: searchParams.get('hotel_regime') === 'true',
            foreclosure: searchParams.get('foreclosure') === 'true',
            owner_phone: searchParams.get('owner_phone') || '',
            features: searchParams.getAll('features')
        });
    }, [searchParams]);

    const handleChange = (field: string, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleFeatureToggle = (feature: string) => {
        setFilters(prev => {
            const currentFeatures = prev.features || [];
            if (currentFeatures.includes(feature)) {
                return { ...prev, features: currentFeatures.filter(f => f !== feature) };
            } else {
                return { ...prev, features: [...currentFeatures, feature] };
            }
        });
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (filters.keywords) params.set('keywords', filters.keywords);
        if (filters.listing_type) params.set('listing_type', filters.listing_type);
        if (filters.type) params.set('type', filters.type);
        if (filters.location_county) params.set('location_county', filters.location_county);
        if (filters.location_city) params.set('location_city', filters.location_city);
        if (filters.location_area) params.set('location_area', filters.location_area);
        if (filters.location_polygon && Array.isArray(filters.location_polygon) && filters.location_polygon.length > 0) {
            params.set('location_polygon', JSON.stringify(filters.location_polygon));
        } else {
            params.delete('location_polygon');
        }
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.rooms) params.set('rooms', filters.rooms);
        if (filters.area) params.set('area', filters.area);
        if (filters.bathrooms) params.set('bathrooms', filters.bathrooms);
        if (filters.year_built) params.set('year_built', filters.year_built);
        if (filters.floor) params.set('floor', filters.floor);
        if (filters.partitioning) params.set('partitioning', filters.partitioning);
        if (filters.comfort) params.set('comfort', filters.comfort);
        if (filters.building_type) params.set('building_type', filters.building_type);
        if (filters.interior_condition) params.set('interior_condition', filters.interior_condition);
        if (filters.furnishing) params.set('furnishing', filters.furnishing);
        if (filters.has_video) params.set('has_video', 'true');
        if (filters.has_virtual_tour) params.set('has_virtual_tour', 'true');
        if (filters.commission_0) params.set('commission_0', 'true');
        if (filters.exclusive) params.set('exclusive', 'true');
        if (filters.luxury) params.set('luxury', 'true');
        if (filters.hotel_regime) params.set('hotel_regime', 'true');
        if (filters.foreclosure) params.set('foreclosure', 'true');
        if (filters.owner_phone) params.set('owner_phone', filters.owner_phone);
        
        filters.features.forEach(f => params.append('features', f));
        
        router.push(`${basePath}?${params.toString()}`);
    };

    const clearFilters = () => {
        setFilters({
            keywords: '', listing_type: '', type: '', location_county: '', location_city: '', location_area: '',
            location_polygon: null,
            minPrice: '', maxPrice: '', rooms: '', area: '', bathrooms: '',
            year_built: '', floor: '', partitioning: '', comfort: '',
            building_type: '', interior_condition: '', furnishing: '',
            has_video: false, has_virtual_tour: false, commission_0: false,
            exclusive: false, luxury: false, hotel_regime: false, foreclosure: false,
            owner_phone: '',
            features: []
        });
        setShowAmenities(false);
        setShowMoreDetails(false);
        router.push(basePath);
    };

    // Save Search Logic
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    const handleSaveSearch = async () => {
        if (!searchName.trim()) return;
        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            const activeFilters: any = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (key === 'features' && Array.isArray(value) && value.length > 0) {
                    activeFilters[key] = value;
                } else if (value !== '' && value !== false && key !== 'features') {
                    activeFilters[key] = value;
                }
            });

            const result = await saveSearch(searchName, activeFilters);
            if (result.success) {
                setSaveMessage({ type: 'success', text: 'Search saved successfully!' });
                setTimeout(() => {
                    setIsSaveModalOpen(false);
                    setSearchName('');
                    setSaveMessage({ type: '', text: '' });
                }, 1500);
            } else {
                setSaveMessage({ type: 'error', text: result.error || 'Failed to save' });
            }
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative group mb-8 p-[2px] rounded-2xl overflow-hidden isolation-auto">
            {/* Neon Border Animation Layer */}
            <div className="absolute inset-0">
                <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F472B6_0%,#60A5FA_25%,#34D399_50%,#F472B6_75%,#F472B6_100%)] opacity-70 blur-sm" />
            </div>

            {/* Inner Content Card */}
            <div className="relative bg-white rounded-2xl h-full z-10 overflow-hidden shadow-sm">

                {/* 1-Row Collapsible Header Card */}
                <div
                    onClick={() => setIsMainExpanded(!isMainExpanded)}
                    className="w-full px-5 py-3.5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-slate-50 rounded-2xl group"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                            <SlidersHorizontal className="w-4.5 h-4.5" />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                            <span className="font-extrabold text-base text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">
                                Apply More Filters
                            </span>

                            {/* Active filter count / chips */}
                            {activeFilterPills.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-sm">
                                        {activeFilterPills.length} {activeFilterPills.length === 1 ? 'Filter' : 'Filters'} Active
                                    </span>
                                    <div className="hidden lg:flex items-center gap-1.5 overflow-hidden">
                                        {activeFilterPills.slice(0, 3).map((pill, i) => (
                                            <span key={i} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md border border-slate-200/80 truncate max-w-[150px]">
                                                {pill}
                                            </span>
                                        ))}
                                        {activeFilterPills.length > 3 && (
                                            <span className="text-slate-400 text-xs font-medium">+{activeFilterPills.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
                                    Click to customize search options
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {activeFilterPills.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearFilters();
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-all mr-1"
                            >
                                Clear
                            </button>
                        )}
                        <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                            {isMainExpanded ? (
                                <ChevronUp className="w-5 h-5 transition-transform duration-300" />
                            ) : (
                                <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Search Modal */}
                {isSaveModalOpen && (
                    <div className="absolute top-20 right-5 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="font-bold text-slate-800 mb-2">Save this Search</h3>
                        <input
                            type="text"
                            placeholder="e.g. 2 Bed in City Center"
                            className="w-full p-2 border border-slate-300 rounded-md text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            autoFocus
                        />
                        {saveMessage.text && (
                            <div className={`text-xs mb-3 px-2 py-1 rounded ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {saveMessage.text}
                            </div>
                        )}
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setIsSaveModalOpen(false)}
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSearch}
                                disabled={isSaving || !searchName.trim()}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}

                {/* DrawAreaSelector Modal */}
                {showAreaMap && (
                    <DrawAreaSelector
                        city={filters.location_city ? cleanCityName(filters.location_city) : 'Timisoara'}
                        value={filters.location_polygon}
                        onChange={(polygon) => handleChange('location_polygon', polygon)}
                        onClose={() => setShowAreaMap(false)}
                    />
                )}

                {/* EXPANDABLE FILTER CONTENT */}
                {isMainExpanded && (
                    <div className="border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* HEADER / KEY FILTERS SECTION */}
                        <div className="p-5">
                    <div className="space-y-4">

                        {/* Grid of Main Inputs - Row 1 */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isAdmin ? '5' : '4'} gap-4 w-full`}>

                            {/* 1. Search Bar */}
                            <div className="space-y-1 md:col-span-2 lg:col-span-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Search className="w-3 h-3 text-indigo-500" /> Keywords
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ref ID, Title..."
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                                    value={filters.keywords}
                                    onChange={(e) => handleChange('keywords', e.target.value)}
                                />
                            </div>

                            {/* 2. Type & Status */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Home className="w-3 h-3 text-pink-500" /> Property Type
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                                        value={filters.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <select
                                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                                        value={filters.listing_type}
                                        onChange={(e) => handleChange('listing_type', e.target.value)}
                                    >
                                        <option value="">Status</option>
                                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* 3. Price Range */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Banknote className="w-3 h-3 text-emerald-500" /> Price Range
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min €"
                                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.minPrice}
                                        onChange={(e) => handleChange('minPrice', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max €"
                                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleChange('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 4. Rooms & Area */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3 text-orange-500" /> Layout
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                                        value={filters.rooms}
                                        onChange={(e) => handleChange('rooms', e.target.value)}
                                    >
                                        <option value="">Rooms</option>
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Min sqm"
                                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm flex-1 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={filters.area}
                                        onChange={(e) => handleChange('area', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 5. Owner Phone (Admin Only) */}
                            {isAdmin && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-purple-500" /> Owner Phone
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search Owner Phone..."
                                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        value={filters.owner_phone}
                                        onChange={(e) => handleChange('owner_phone', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Row 2: Location & Map Controls + Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-end pt-3 border-t border-slate-100">
                            {/* City Filter */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3 text-blue-500" /> City
                                </label>
                                <MultiSearchableSelect
                                    values={filters.location_city ? filters.location_city.split(',').map(c => c.trim()).filter(Boolean) : []}
                                    options={citiesOptions}
                                    onChange={(vals) => handleChange('location_city', vals.join(', '))}
                                    placeholder="All Cities..."
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium"
                                />
                            </div>

                            {/* Area Filter */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-red-500" /> Area / Neighbourhood
                                </label>
                                <MultiSearchableSelect
                                    values={filters.location_area ? filters.location_area.split(',').map(a => a.trim()).filter(Boolean) : []}
                                    options={areasOptions}
                                    onChange={(vals) => handleChange('location_area', vals.join(', '))}
                                    placeholder="All Areas..."
                                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-medium"
                                />
                            </div>

                            {/* Exact Location Draw Button */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Map className="w-3 h-3 text-violet-500" /> Exact Location Map
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowAreaMap(true)}
                                    className={`w-full h-[34px] px-3 border rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${filters.location_polygon?.length ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <MapPin className="w-3.5 h-3.5 text-violet-600" />
                                    {filters.location_polygon?.length ? 'Edit Area on Map' : '📍 Select / Draw on Map'}
                                </button>
                            </div>

                            {/* Actions Group (Clear, Save, Search) */}
                            <div className="flex gap-2 justify-end self-end shrink-0">
                                {/* Clear Button */}
                                {(Object.values(filters).some(val => val !== '' && val !== false && (!Array.isArray(val) || val.length > 0))) && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="h-[34px] px-3 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setIsSaveModalOpen(!isSaveModalOpen)}
                                    className="h-[34px] px-4 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-transparent"
                                >
                                    Save
                                </button>

                                <button
                                    type="button"
                                    onClick={applyFilters}
                                    className="h-[34px] px-6 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-bold shadow-lg shadow-violet-500/30 transition-all transform hover:-translate-y-0.5 border border-transparent"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* COLLAPSIBLE: More Details */}
                <div className="border-t border-slate-100">
                    <button
                        onClick={() => setShowMoreDetails(!showMoreDetails)}
                        className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-teal-600 hover:bg-teal-50 transition-colors group"
                    >
                        <span className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${hasActiveDetails ? 'bg-teal-100 text-teal-700' : 'bg-teal-50 text-teal-500 group-hover:bg-teal-100'}`}>
                                <SlidersHorizontal className="w-4 h-4" />
                            </span>
                            More Details
                            {hasActiveDetails && <span className="text-teal-700 text-xs bg-teal-100 px-2 py-0.5 rounded-full">Active</span>}
                        </span>
                        {showMoreDetails ? <ChevronUp className="w-4 h-4 text-teal-400" /> : <ChevronDown className="w-4 h-4 text-teal-400" />}
                    </button>

                    {showMoreDetails && (
                        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-1 bg-slate-50/50">

                            {/* Details */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Property Details</label>
                                <div className="flex gap-2">
                                    <select
                                        className="p-2 border rounded-md text-sm flex-1 text-slate-900 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.partitioning}
                                        onChange={(e) => handleChange('partitioning', e.target.value)}
                                    >
                                        <option value="">Partitioning</option>
                                        {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <select
                                        className="p-2 border rounded-md text-sm flex-1 text-slate-900 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.comfort}
                                        onChange={(e) => handleChange('comfort', e.target.value)}
                                    >
                                        <option value="">Comfort</option>
                                        {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Building */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Building Info</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Year Built"
                                        className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-400 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.year_built}
                                        onChange={(e) => handleChange('year_built', e.target.value)}
                                    />
                                    <select
                                        className="p-2 border rounded-md text-sm flex-1 text-slate-900 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.floor}
                                        onChange={(e) => handleChange('floor', e.target.value)}
                                    >
                                        <option value="">Floor</option>
                                        {['Parter', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* County Filter */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">County Filter</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Timis"
                                    className="p-2 border rounded-md text-sm w-full text-slate-900 placeholder:text-slate-400 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                    value={filters.location_county}
                                    onChange={(e) => handleChange('location_county', e.target.value)}
                                />
                            </div>

                            {/* Furnishing */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Condition</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full p-2 border rounded-md text-sm flex-1 text-slate-900 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.furnishing}
                                        onChange={(e) => handleChange('furnishing', e.target.value)}
                                    >
                                        <option value="">Furnishing</option>
                                        {FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <select
                                        className="p-2 border rounded-md text-sm flex-1 text-slate-900 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.interior_condition}
                                        onChange={(e) => handleChange('interior_condition', e.target.value)}
                                    >
                                        <option value="">Status</option>
                                        {INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Options Checkboxes */}
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 pt-4 border-t border-slate-200 mt-2">
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" className="peer rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.has_video} onChange={(e) => handleChange('has_video', e.target.checked)} />
                                            <div className="absolute inset-0 bg-teal-100 rounded-full scale-0 peer-checked:scale-150 opacity-0 peer-checked:opacity-20 transition-all"></div>
                                        </div>
                                        Has Video
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.has_virtual_tour} onChange={(e) => handleChange('has_virtual_tour', e.target.checked)} />
                                        Virtual Tour
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.commission_0} onChange={(e) => handleChange('commission_0', e.target.checked)} />
                                        No Commission
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.exclusive} onChange={(e) => handleChange('exclusive', e.target.checked)} />
                                        Exclusive
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.luxury} onChange={(e) => handleChange('luxury', e.target.checked)} />
                                        Luxury
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900 font-medium group/check">
                                        <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110" checked={filters.foreclosure} onChange={(e) => handleChange('foreclosure', e.target.checked)} />
                                        Foreclosure
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-teal-600 cursor-pointer hover:text-teal-900 font-bold group/check bg-teal-50/50 px-2 py-1 rounded-md border border-teal-100/50">
                                        <input
                                            type="checkbox"
                                            className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 h-4 w-4 transform transition-transform group-hover/check:scale-110"
                                            checked={filters.features?.includes('Open to Collaboration')}
                                            onChange={() => handleFeatureToggle('Open to Collaboration')}
                                        />
                                        Open to Collaboration
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* COLLAPSIBLE: Amenities */}
                <div className="border-t border-slate-100">
                    <button
                        onClick={() => setShowAmenities(!showAmenities)}
                        className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors group"
                    >
                        <span className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${hasActiveAmenities ? 'bg-amber-100 text-amber-700' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </span>
                            Amenities & Features
                            {hasActiveAmenities && <span className="text-amber-700 text-xs bg-amber-100 px-2 py-0.5 rounded-full">Selected: {filters.features?.length}</span>}
                        </span>
                        {showAmenities ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
                    </button>

                    {showAmenities && (
                        <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-1 bg-slate-50/50">
                            <div className="space-y-6 mt-4">
                                {Object.entries(FEATURE_CATEGORIES)
                                    .filter(([category]) => category !== 'Listing Tags')
                                    .map(([category, features]) => {
                                        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Unit Features'];
                                        return (
                                            <div key={category} className="space-y-3">
                                                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.filterText} flex items-center gap-2`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.filterDot}`}></div>
                                                    {category}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                                    {(features as unknown as string[]).map(feature => (
                                                        <label key={feature} className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer hover:text-slate-900 bg-white p-2.5 rounded-lg border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all group/feat">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                                                                checked={filters.features?.includes(feature)}
                                                                onChange={() => handleFeatureToggle(feature)}
                                                            />
                                                            <span className="group-hover/feat:text-amber-700 transition-colors">{feature}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
                    </div>
                )}
            </div>
        </div>
    );
}

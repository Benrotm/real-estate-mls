'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROPERTY_TYPES, TRANSACTION_TYPES, COMFORT_TYPES, PARTITIONING_TYPES, PROPERTY_FEATURES, INTERIOR_CONDITIONS, FURNISHING_TYPES } from '@/app/lib/properties';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, Home, Banknote } from 'lucide-react';
import { saveSearch } from '@/app/lib/actions/savedSearches';

export default function PropertySearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Collapsible sections state
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const [showAmenities, setShowAmenities] = useState(false);

    // Initialize state from URL params
    const initialFeatures = searchParams.getAll('features');

    const [filters, setFilters] = useState({
        listing_type: searchParams.get('listing_type') || '',
        type: searchParams.get('type') || '',
        location_county: searchParams.get('location_county') || '',
        location_city: searchParams.get('location_city') || '',
        location_area: searchParams.get('location_area') || '',
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
        features: initialFeatures
    });

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
            listing_type: searchParams.get('listing_type') || '',
            type: searchParams.get('type') || '',
            location_county: searchParams.get('location_county') || '',
            location_city: searchParams.get('location_city') || '',
            location_area: searchParams.get('location_area') || '',
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
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'features' && Array.isArray(value)) {
                value.forEach(f => params.append('features', f));
            } else if (value) {
                params.set(key, String(value));
            }
        });
        router.push(`/properties?${params.toString()}`);
    };

    const clearFilters = () => {
        setFilters({
            listing_type: '', type: '', location_county: '', location_city: '', location_area: '',
            minPrice: '', maxPrice: '', rooms: '', area: '', bathrooms: '',
            year_built: '', floor: '', partitioning: '', comfort: '',
            building_type: '', interior_condition: '', furnishing: '',
            has_video: false, has_virtual_tour: false, commission_0: false,
            exclusive: false, luxury: false, hotel_regime: false, foreclosure: false,
            features: []
        });
        setShowAmenities(false);
        setShowMoreDetails(false);
        router.push('/properties');
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
        <div className="relative group mb-8">
            {/* Neon Border Animation Layer - Isolated with overflow hidden */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div className="absolute inset-[-50%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F472B6_0%,#60A5FA_25%,#34D399_50%,#F472B6_75%,#F472B6_100%)] opacity-70 blur-sm" />
            </div>

            {/* Inner Content Card */}
            <div className="relative bg-white rounded-2xl border border-transparent shadow-xl h-full z-10">

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

                {/* HEADER / KEY FILTERS SECTION - "Always Visible" */}
                <div className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">

                        {/* Grid of Main Inputs */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">

                            {/* 1. Search Bar */}
                            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-indigo-500" /> Keywords
                                </label>
                                <input
                                    type="text"
                                    placeholder="City, Area, Name..."
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                                    value={filters.location_city || filters.location_area ? `${filters.location_city} ${filters.location_area}`.trim() : ''}
                                    onChange={(e) => handleChange('location_city', e.target.value)}
                                />
                            </div>

                            {/* 2. Type & Status */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Home className="w-3.5 h-3.5 text-pink-500" /> Property Type
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                                        value={filters.type}
                                        onChange={(e) => handleChange('type', e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <select
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900"
                                        value={filters.listing_type}
                                        onChange={(e) => handleChange('listing_type', e.target.value)}
                                    >
                                        <option value="">Status</option>
                                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* 3. Price Range */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Price Range
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min €"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.minPrice}
                                        onChange={(e) => handleChange('minPrice', e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max €"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleChange('maxPrice', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* 4. Rooms & Area */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" /> Layout
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                                        value={filters.rooms}
                                        onChange={(e) => handleChange('rooms', e.target.value)}
                                    >
                                        <option value="">Rooms</option>
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Min sqm"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm flex-1 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        value={filters.area}
                                        onChange={(e) => handleChange('area', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions Group */}
                        <div className="flex gap-2 self-end shrink-0">
                            {/* Clear Button */}
                            {(Object.values(filters).some(val => val !== '' && val !== false && (!Array.isArray(val) || val.length > 0))) && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="h-[42px] px-4 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsSaveModalOpen(!isSaveModalOpen)}
                                className="h-[42px] px-5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 border border-transparent"
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={applyFilters}
                                className="h-[42px] px-8 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-sm font-bold shadow-lg shadow-violet-500/30 transition-all transform hover:-translate-y-0.5 border border-transparent"
                            >
                                Search
                            </button>
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

                            {/* Location Detail */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Exact Location</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="County"
                                        className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-400 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.location_county}
                                        onChange={(e) => handleChange('location_county', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Sector/Area"
                                        className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-400 focus:ring-teal-500 focus:border-teal-500"
                                        value={filters.location_area}
                                        onChange={(e) => handleChange('location_area', e.target.value)}
                                    />
                                </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {PROPERTY_FEATURES.map(feature => (
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
                    )}
                </div>
            </div>
        </div>
    );
}

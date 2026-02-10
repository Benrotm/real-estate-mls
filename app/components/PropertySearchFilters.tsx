'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROPERTY_TYPES, TRANSACTION_TYPES, COMFORT_TYPES, PARTITIONING_TYPES, PROPERTY_FEATURES, BUILDING_TYPES, INTERIOR_CONDITIONS, FURNISHING_TYPES } from '@/app/lib/properties';
import { Search, X } from 'lucide-react';

export default function PropertySearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showFilters, setShowFilters] = useState(false);

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

        // New Filters
        building_type: searchParams.get('building_type') || '',
        interior_condition: searchParams.get('interior_condition') || '',
        furnishing: searchParams.get('furnishing') || '',

        // Checkboxes
        has_video: searchParams.get('has_video') === 'true',
        has_virtual_tour: searchParams.get('has_virtual_tour') === 'true',
        commission_0: searchParams.get('commission_0') === 'true',
        exclusive: searchParams.get('exclusive') === 'true',
        luxury: searchParams.get('luxury') === 'true',
        hotel_regime: searchParams.get('hotel_regime') === 'true',
        foreclosure: searchParams.get('foreclosure') === 'true',

        // New Features Array
        features: initialFeatures
    });

    // Sync state with URL params when they change (e.g. Back button, Clear Filters)
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
        router.push('/properties');
    };

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    // Import action dynamically to avoid server-component issues in client component if not handled right, 
    // but here we can just import at top. 
    // Wait, let's add the import statement at the top first using a separate edit if needed, 
    // or assume I can rewrite the whole file or large chunk. 
    // I'll rewrite the return statement and add the helper functions.

    const handleSaveSearch = async () => {
        if (!searchName.trim()) return;
        setIsSaving(true);
        setSaveMessage({ type: '', text: '' });

        try {
            // Dynamically import the action to ensure it works in client component
            const { saveSearch } = await import('@/app/lib/actions/savedSearches');

            // Filter out empty values to keep the saved query clean
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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 relative">
            {/* Save Search Modal */}
            {isSaveModalOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
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

            {/* Top Bar: Search + Core Filters */}
            <div className="flex flex-col lg:flex-row gap-3 items-center mb-0">

                {/* Search Inputs Group */}
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by location, property name..."
                        className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
                        value={filters.location_city || filters.location_area ? `${filters.location_city} ${filters.location_area}`.trim() : ''}
                        onChange={(e) => {
                            handleChange('location_city', e.target.value);
                        }}
                    />
                </div>

                {/* Core Types Dropdowns */}
                <div className="flex gap-2 w-full lg:w-auto">
                    <select
                        className="p-2 border rounded-md text-sm flex-1 lg:flex-none lg:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                        value={filters.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                    >
                        <option value="">All Types</option>
                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select
                        className="p-2 border rounded-md text-sm flex-1 lg:flex-none lg:w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                        value={filters.listing_type}
                        onChange={(e) => handleChange('listing_type', e.target.value)}
                    >
                        <option value="">Status</option>
                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full lg:w-auto items-center">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-3 py-2 rounded-md text-sm font-medium border flex items-center gap-1 transition-colors whitespace-nowrap
                            ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        {showFilters ? 'Hide' : 'Filters'}
                    </button>

                    {/* Clear Button - Visible if filters active */}
                    {(Object.values(filters).some(val => val !== '' && val !== false && (!Array.isArray(val) || val.length > 0))) && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="bg-red-50 text-red-600 border border-red-100 px-3 py-2 rounded-md hover:bg-red-100 text-sm font-medium transition-colors whitespace-nowrap"
                            title="Clear All Filters"
                        >
                            Clear
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={applyFilters}
                        className="bg-slate-900 text-white px-5 py-2 rounded-md hover:bg-slate-800 text-sm font-bold shadow-sm transition-colors flex-1 lg:flex-none"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsSaveModalOpen(!isSaveModalOpen)}
                        className="bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-md hover:text-blue-600 hover:border-blue-200 text-sm font-medium transition-colors"
                        title="Save Search"
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Expandable Advanced Filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

                        {/* Price Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Price Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min Price"
                                    className="w-full p-2 border rounded-md text-sm text-slate-900 placeholder:text-slate-500"
                                    value={filters.minPrice}
                                    onChange={(e) => handleChange('minPrice', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Max Price"
                                    className="w-full p-2 border rounded-md text-sm text-slate-900 placeholder:text-slate-500"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Area Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Surface Area (sqm)</label>
                            <input
                                type="number"
                                placeholder="Min Sqm"
                                className="w-full p-2 border rounded-md text-sm text-slate-900 placeholder:text-slate-500"
                                value={filters.area}
                                onChange={(e) => handleChange('area', e.target.value)}
                            />
                        </div>

                        {/* Rooms & Baths */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Layout</label>
                            <div className="flex gap-2">
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.rooms}
                                    onChange={(e) => handleChange('rooms', e.target.value)}
                                >
                                    <option value="">Rooms</option>
                                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                                </select>
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.bathrooms}
                                    onChange={(e) => handleChange('bathrooms', e.target.value)}
                                >
                                    <option value="">Baths</option>
                                    {[1, 2, 3].map(n => <option key={n} value={n}>{n}+</option>)}
                                </select>
                            </div>
                        </div>


                        {/* Location Advanced */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Location Details</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="County"
                                    className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-500"
                                    value={filters.location_county}
                                    onChange={(e) => handleChange('location_county', e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Area"
                                    className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-500"
                                    value={filters.location_area}
                                    onChange={(e) => handleChange('location_area', e.target.value)}
                                />
                            </div>
                        </div>


                        {/* Other Specs */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Details</label>
                            <div className="flex gap-2">
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.partitioning}
                                    onChange={(e) => handleChange('partitioning', e.target.value)}
                                >
                                    <option value="">Partitioning</option>
                                    {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.comfort}
                                    onChange={(e) => handleChange('comfort', e.target.value)}
                                >
                                    <option value="">Comfort</option>
                                    {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Building</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Year (min)"
                                    className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-500"
                                    value={filters.year_built}
                                    onChange={(e) => handleChange('year_built', e.target.value)}
                                />
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.floor}
                                    onChange={(e) => handleChange('floor', e.target.value)}
                                >
                                    <option value="">Floor</option>
                                    {['Parter', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Enhanced Characteristics */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Characteristics</label>
                            <div className="flex gap-2 mb-1">
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 w-full text-slate-900 placeholder:text-slate-500"
                                    value={filters.building_type}
                                    onChange={(e) => handleChange('building_type', e.target.value)}
                                >
                                    <option value="">Building Type</option>
                                    {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.interior_condition}
                                    onChange={(e) => handleChange('interior_condition', e.target.value)}
                                >
                                    <option value="">Condition</option>
                                    {INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select
                                    className="p-2 border rounded-md text-sm flex-1 text-slate-900"
                                    value={filters.furnishing}
                                    onChange={(e) => handleChange('furnishing', e.target.value)}
                                >
                                    <option value="">Furnishing</option>
                                    {FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                    </div>


                    {/* Amenities / Features Section */}
                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase block mb-2">Amenities</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                            {PROPERTY_FEATURES.map(feature => (
                                <label key={feature} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer hover:text-slate-900">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={filters.features?.includes(feature)}
                                        onChange={() => handleFeatureToggle(feature)}
                                    />
                                    {feature}
                                </label>
                            ))}
                        </div>
                    </div>


                    {/* Checkboxes Row */}
                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 mt-2">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.has_video} onChange={(e) => handleChange('has_video', e.target.checked)} />
                            Has Video
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.has_virtual_tour} onChange={(e) => handleChange('has_virtual_tour', e.target.checked)} />
                            Virtual Tour
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.commission_0} onChange={(e) => handleChange('commission_0', e.target.checked)} />
                            No Commission
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.exclusive} onChange={(e) => handleChange('exclusive', e.target.checked)} />
                            Exclusive
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.luxury} onChange={(e) => handleChange('luxury', e.target.checked)} />
                            Luxury
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                            <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={filters.foreclosure} onChange={(e) => handleChange('foreclosure', e.target.checked)} />
                            Foreclosure
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

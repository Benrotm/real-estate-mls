'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PROPERTY_TYPES, TRANSACTION_TYPES, COMFORT_TYPES, PARTITIONING_TYPES } from '@/app/lib/properties';
import { Search, X } from 'lucide-react';

export default function PropertySearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
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

        // Checkboxes
        has_video: searchParams.get('has_video') === 'true',
        has_virtual_tour: searchParams.get('has_virtual_tour') === 'true',
        commission_0: searchParams.get('commission_0') === 'true',
        exclusive: searchParams.get('exclusive') === 'true',
        luxury: searchParams.get('luxury') === 'true',
        hotel_regime: searchParams.get('hotel_regime') === 'true',
        foreclosure: searchParams.get('foreclosure') === 'true',
    });

    const handleChange = (field: string, value: any) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
        });
        router.push(`/properties?${params.toString()}`);
    };

    const clearFilters = () => {
        setFilters({
            listing_type: '', type: '', location_county: '', location_city: '', location_area: '',
            minPrice: '', maxPrice: '', rooms: '', area: '', bathrooms: '',
            year_built: '', floor: '', partitioning: '', comfort: '',
            has_video: false, has_virtual_tour: false, commission_0: false,
            exclusive: false, luxury: false, hotel_regime: false, foreclosure: false
        });
        router.push('/properties');
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                {/* Row 1 */}
                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.listing_type}
                    onChange={(e) => handleChange('listing_type', e.target.value)}
                >
                    <option value="">Transaction Type</option>
                    {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                >
                    <option value="">Property Type</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <input
                    type="text"
                    placeholder="Judetul"
                    className="p-2 border rounded-md text-sm"
                    value={filters.location_county}
                    onChange={(e) => handleChange('location_county', e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Localitatea"
                    className="p-2 border rounded-md text-sm"
                    value={filters.location_city}
                    onChange={(e) => handleChange('location_city', e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Cartiere/Zone"
                    className="p-2 border rounded-md text-sm"
                    value={filters.location_area}
                    onChange={(e) => handleChange('location_area', e.target.value)}
                />

                {/* Row 2 */}
                <input
                    type="number"
                    placeholder="Pret Minim"
                    className="p-2 border rounded-md text-sm"
                    value={filters.minPrice}
                    onChange={(e) => handleChange('minPrice', e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Pret Maxim"
                    className="p-2 border rounded-md text-sm"
                    value={filters.maxPrice}
                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                />

                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.rooms}
                    onChange={(e) => handleChange('rooms', e.target.value)}
                >
                    <option value="">Numar Camere</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}+</option>)}
                </select>

                <input
                    type="number"
                    placeholder="Suprafata Utila"
                    className="p-2 border rounded-md text-sm"
                    value={filters.area}
                    onChange={(e) => handleChange('area', e.target.value)}
                />

                <div className="flex gap-2">
                    <select
                        className="p-2 border rounded-md text-sm flex-1"
                        value={filters.bathrooms}
                        onChange={(e) => handleChange('bathrooms', e.target.value)}
                    >
                        <option value="">Bai</option>
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>

                    <button
                        onClick={applyFilters}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-bold shadow-sm"
                    >
                        Cauta
                    </button>
                    <button
                        onClick={clearFilters}
                        className="bg-slate-200 text-slate-600 px-3 py-2 rounded-md hover:bg-slate-300"
                        title="Clear Filters"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Row 3 - Advanced */}
                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.partitioning}
                    onChange={(e) => handleChange('partitioning', e.target.value)}
                >
                    <option value="">Compartimentare</option>
                    {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.comfort}
                    onChange={(e) => handleChange('comfort', e.target.value)}
                >
                    <option value="">Confort</option>
                    {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <input
                    type="number"
                    placeholder="An Constructie (Min)"
                    className="p-2 border rounded-md text-sm"
                    value={filters.year_built}
                    onChange={(e) => handleChange('year_built', e.target.value)}
                />

                <select
                    className="p-2 border rounded-md text-sm"
                    value={filters.floor}
                    onChange={(e) => handleChange('floor', e.target.value)}
                >
                    <option value="">Etaj</option>
                    {['Parter', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>

            {/* Checkboxes Row */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100 mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.has_video} onChange={(e) => handleChange('has_video', e.target.checked)} />
                    Cu Video
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.has_virtual_tour} onChange={(e) => handleChange('has_virtual_tour', e.target.checked)} />
                    Cu Tur Virtual
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.commission_0} onChange={(e) => handleChange('commission_0', e.target.checked)} />
                    Comision 0%
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.exclusive} onChange={(e) => handleChange('exclusive', e.target.checked)} />
                    Exclusiva
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.luxury} onChange={(e) => handleChange('luxury', e.target.checked)} />
                    De Lux
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.hotel_regime} onChange={(e) => handleChange('hotel_regime', e.target.checked)} />
                    Regim Hotelier
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={filters.foreclosure} onChange={(e) => handleChange('foreclosure', e.target.checked)} />
                    Executare Silita
                </label>
            </div>

            <div className="mt-2 text-right">
                <span className="text-xs text-slate-400">ordonat dupa relevanta</span>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import PropertyCard from "@/app/components/PropertyCard";
import PropertyMap from "@/app/components/PropertyMap";
import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import { Filter, Map, LayoutGrid, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [filters, setFilters] = useState({
        listingTypes: [] as string[],
        propertyTypes: [] as string[],
        priceRange: 10000000,
        beds: null as number | '5+' | null
    });

    useEffect(() => {
        async function fetchProperties() {
            setLoading(true);
            const { data, error } = await supabase
                .from('properties')
                .select('*');

            if (data && data.length > 0) {
                const mapped: Property[] = data.map(dbProp => ({
                    id: dbProp.id,
                    listingType: dbProp.listing_type,
                    currency: dbProp.currency,
                    title: dbProp.title,
                    description: dbProp.description,
                    location: {
                        address: dbProp.address,
                        city: dbProp.city,
                        state: dbProp.state,
                        zip: dbProp.zip,
                        lat: dbProp.lat,
                        lng: dbProp.lng
                    },
                    price: dbProp.price,
                    specs: {
                        beds: dbProp.beds,
                        baths: dbProp.baths,
                        sqft: dbProp.sqft,
                        yearBuilt: dbProp.year_built,
                        type: dbProp.property_type,
                        stories: dbProp.stories,
                        floor: dbProp.floor,
                        interiorRating: dbProp.interior_rating
                    },
                    features: dbProp.features || [],
                    images: dbProp.images || [],
                    agent: {
                        id: dbProp.agent_id || 'a1',
                        name: 'Sarah Broker',
                        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                        phone: '(555) 123-4567'
                    },
                    virtualTourUrl: dbProp.virtual_tour_url,
                    isFeatured: dbProp.is_featured
                }));
                setProperties(mapped);
            }
            setLoading(false);
        }
        fetchProperties();
    }, []);

    const filteredProperties = properties.filter(p => {
        const matchListingType = filters.listingTypes.length === 0 || filters.listingTypes.includes(p.listingType);
        const matchPropertyType = filters.propertyTypes.length === 0 || filters.propertyTypes.includes(p.specs.type);
        const matchPrice = p.price <= filters.priceRange;
        const matchBeds = filters.beds === null ||
            (filters.beds === '5+' ? p.specs.beds >= 5 : p.specs.beds === filters.beds);

        return matchListingType && matchPropertyType && matchPrice && matchBeds;
    });

    const markers = filteredProperties.map(p => ({
        id: p.id,
        lat: p.location.lat,
        lng: p.location.lng,
        title: p.title
    }));

    const toggleFilter = (category: 'listingTypes' | 'propertyTypes', value: string) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(v => v !== value)
                : [...prev[category], value]
        }));
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary text-primary-foreground py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold mb-4">Find Your Perfect Home</h1>
                    <p className="text-primary-foreground/70 max-w-2xl">
                        Browse our exclusive collection of premium properties. Use the filters to find the exact match for your lifestyle.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
                        <div className="bg-card p-6 rounded-xl border border-border sticky top-24">
                            <div className="flex items-center gap-2 mb-6 text-foreground">
                                <Filter className="w-5 h-5" />
                                <h2 className="font-bold">Filters</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground/80">Listing Type</label>
                                    <div className="space-y-2">
                                        {['For Sale', 'For Rent'].map(type => (
                                            <label key={type} className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.listingTypes.includes(type)}
                                                    onChange={() => toggleFilter('listingTypes', type)}
                                                    className="rounded border-gray-300 text-secondary focus:ring-secondary"
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground/80">Price Range</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="10000000"
                                        step="100000"
                                        value={filters.priceRange}
                                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: parseInt(e.target.value) }))}
                                        className="w-full accent-secondary"
                                    />
                                    <div className="flex justify-between text-xs text-foreground/60 mt-1">
                                        <span>$0</span>
                                        <span>$10M+</span>
                                    </div>
                                    <div className="text-center text-xs font-bold text-secondary mt-2">
                                        Max: ${new Intl.NumberFormat().format(filters.priceRange)}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground/80">Property Type</label>
                                    <div className="space-y-2">
                                        {['Apartment', 'House', 'Land', 'Commercial', 'Industrial', 'Business'].map(type => (
                                            <label key={type} className="flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={filters.propertyTypes.includes(type)}
                                                    onChange={() => toggleFilter('propertyTypes', type)}
                                                    className="rounded border-gray-300 text-secondary focus:ring-secondary"
                                                />
                                                {type}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block text-foreground/80">Bedrooms</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {[1, 2, 3, 4, '5+'].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setFilters(prev => ({ ...prev, beds: prev.beds === num ? null : num as any }))}
                                                className={`w-8 h-8 rounded border flex items-center justify-center text-sm transition-colors ${filters.beds === num ? 'bg-secondary text-white border-secondary' : 'border-border hover:bg-secondary/10'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setFilters({ listingTypes: [], propertyTypes: [], priceRange: 10000000, beds: null })}
                                    className="w-full border border-border text-foreground/60 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-foreground/60">{filteredProperties.length} Properties Found</span>
                                {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                            </div>
                            <div className="flex items-center gap-4">
                                {/* View Toggle */}
                                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('map')}
                                        className={`p-2 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                        title="Map View"
                                    >
                                        <Map className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="h-6 w-px bg-gray-300"></div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-foreground/60">Sort by:</span>
                                    <select className="bg-card border border-border rounded-md text-sm p-1">
                                        <option>Newest</option>
                                        <option>Price: High to Low</option>
                                        <option>Price: Low to High</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredProperties.map(prop => (
                                    <PropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        ) : (
                            <div className="h-[600px] w-full bg-gray-100 rounded-xl overflow-hidden border border-border shadow-inner">
                                <PropertyMap
                                    center={filteredProperties.length > 0 ? { lat: filteredProperties[0].location.lat, lng: filteredProperties[0].location.lng } : { lat: 39.8283, lng: -98.5795 }}
                                    zoom={filteredProperties.length > 0 ? 10 : 4}
                                    markers={markers}
                                    height="100%"
                                />
                            </div>
                        )}

                        {filteredProperties.length === 0 && (
                            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border mt-6">
                                <p className="text-foreground/50">No properties found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

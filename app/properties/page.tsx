'use client';

import { useState, useEffect } from 'react';
import PropertyCard from "@/app/components/PropertyCard";
import PropertyMap from "@/app/components/PropertyMap";
import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import { Map, LayoutGrid, Loader2, Search, ListFilter, Bookmark, ChevronDown } from "lucide-react";
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

            // For visual testing of the 10 mock properties, we will skip the DB fetch
            // distinct from the production behavior to ensure the list is full.


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
        <div className="min-h-screen bg-white pb-20 font-sans">
            {/* 1. Header & Floating Filter Bar Area */}
            <div className="relative bg-slate-900 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-white mb-2">All Properties</h1>
                    <p className="text-slate-400 text-lg">{filteredProperties.length} properties available</p>
                </div>

                {/* Floating Filter Bar */}
                <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4">
                    <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl p-3 flex flex-col md:flex-row items-center gap-4 border border-slate-100">
                        {/* Search Input */}
                        <div className="flex-grow w-full md:w-auto relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by location, property name..."
                                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm placeholder-slate-400"
                            />
                        </div>

                        {/* Dropdowns */}
                        <div className="w-full md:w-48 relative">
                            <select className="block w-full pl-3 pr-10 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                                value={filters.propertyTypes[0] || ''}
                                onChange={(e) => toggleFilter('propertyTypes', e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="House">Houses</option>
                                <option value="Apartment">Apartments</option>
                                <option value="Villa">Villas</option>
                                <option value="Commercial">Commercial</option>
                            </select>
                        </div>

                        <div className="w-full md:w-48 relative">
                            <select className="block w-full pl-3 pr-10 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white"
                                value={filters.listingTypes[0] || ''}
                                onChange={(e) => toggleFilter('listingTypes', e.target.value)}
                            >
                                <option value="">All Properties</option>
                                <option value="For Sale">For Sale</option>
                                <option value="For Rent">For Rent</option>
                            </select>
                        </div>


                        {/* More Filters & Search */}
                        <div className="flex w-full md:w-auto gap-3">
                            <button className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-lg text-slate-700 font-bold text-sm hover:border-slate-900 hover:bg-slate-50 transition-colors whitespace-nowrap flex-grow md:flex-grow-0">
                                <ListFilter className="w-4 h-4" />
                                More Filters
                            </button>
                            <button className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 flex-grow md:flex-grow-0">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer for floating bar */}
            <div className="h-16 md:h-20 bg-gray-50/50"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

                {/* 2. Control Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <span className="text-slate-500 font-medium">Showing <span className="font-bold text-slate-900">{filteredProperties.length}</span> properties</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-bold hover:border-slate-400 transition-colors bg-white">
                            <Bookmark className="w-4 h-4" />
                            Save Search
                        </button>

                        <div className="relative">
                            <select className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-slate-400 cursor-pointer">
                                <option>Newest First</option>
                                <option>Price: High to Low</option>
                                <option>Price: Low to High</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`p-1.5 rounded transition-all ${viewMode === 'map' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Map className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. Content Area */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Note: Sidebar was removed in the new design favor of top bar, unless user wants both. The screenshot shows mostly top bar. 
                        We will hide sidebar for now to match the screenshot "full width" look or keep it if strictly needed. 
                        The screenshot implies a full-width grid. Let's maximize grid space.
                    */}

                    <div className="flex-1">
                        {loading && (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
                            </div>
                        )}

                        {!loading && viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredProperties.map(prop => (
                                    <PropertyCard key={prop.id} property={prop} />
                                ))}
                            </div>
                        )}

                        {!loading && viewMode === 'map' && (
                            <div className="h-[700px] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                                <PropertyMap
                                    center={filteredProperties.length > 0 ? { lat: filteredProperties[0].location.lat, lng: filteredProperties[0].location.lng } : { lat: 39.8283, lng: -98.5795 }}
                                    zoom={filteredProperties.length > 0 ? 10 : 4}
                                    markers={markers}
                                    height="100%"
                                />
                            </div>
                        )}

                        {!loading && filteredProperties.length === 0 && (
                            <div className="text-center py-32 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <div className="text-4xl mb-4">🔍</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">No properties found</h3>
                                <p className="text-slate-500">Try adjusting your filters or search criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


import { getProperties } from '@/app/lib/actions/properties';
import PropertySearchFilters from '@/app/components/PropertySearchFilters';
import PropertyCard from '@/app/components/PropertyCard';
import { Suspense } from 'react';
import { bulkCheckUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { Loader2 } from 'lucide-react';

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<any> }) {
    // Await searchParams in case it's a promise (Next.js 15+ compat)
    const filters = await searchParams;
    const properties = await getProperties(filters);

    // Bulk check for "Make an Offer" feature for all property owners
    const ownerIds = Array.from(new Set(properties.map(p => p.owner_id).filter(Boolean)));
    const makeOfferAccessMap = await bulkCheckUserFeatureAccess(ownerIds, SYSTEM_FEATURES.MAKE_AN_OFFER);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 border-b border-indigo-700 py-10 mb-6 shadow-lg relative overflow-hidden">
                {/* Background Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-widest uppercase [text-shadow:1px_1px_0px_#3730a3,2px_2px_0px_#3730a3,3px_3px_0px_#3730a3,4px_4px_0px_#3730a3,5px_5px_10px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-300">
                        Properties for Sale & Rent
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-sm">Loading filters...</div>}>
                    <PropertySearchFilters />
                </Suspense>

                <div className="mb-4 font-bold text-slate-700">
                    {properties.length} Properties Found
                </div>

                {properties.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                        <p className="text-slate-500">Try adjusting your filters to see more results.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map((property: any) => (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                showMakeOffer={true}
                                isMakeOfferLocked={property.owner_id ? !makeOfferAccessMap[property.owner_id] : true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

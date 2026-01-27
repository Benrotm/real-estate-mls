
import { getProperties } from '@/app/lib/actions/properties';
import PropertySearchFilters from '@/app/components/PropertySearchFilters';
import PropertyCard from '@/app/components/PropertyCard';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function PropertiesPage({ searchParams }: { searchParams: any }) {
    // Await searchParams in case it's a promise (Next.js 15+ compat, though safe here usually)
    const filters = searchParams;
    const properties = await getProperties(filters);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="bg-white border-b border-slate-200 py-8 mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">Properties for Sale & Rent</h1>
                    <p className="text-slate-500 max-w-2xl">Browse our extensive inventory of properties including apartments, houses, commercial spaces, and investment opportunities.</p>
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
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

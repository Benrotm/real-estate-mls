import { getUserProperties } from '@/app/lib/actions/properties';
import PropertyCard from '@/app/components/PropertyCard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function OwnerPropertiesPage() {
    const properties = await getUserProperties();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
                <Link
                    href="/properties/add"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" /> Add Property
                </Link>
            </div>

            {properties.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-4">You haven't listed any properties yet.</p>
                    <Link
                        href="/properties/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> List Your First Property
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                        <PropertyCard key={property.id} property={property} showEditButton={true} />
                    ))}
                </div>
            )}
        </div>
    );
}

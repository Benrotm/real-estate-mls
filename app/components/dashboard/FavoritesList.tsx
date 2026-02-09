'use client';

import { Property } from '@/app/lib/properties';
import PropertyCard from '@/app/components/PropertyCard';
import { Heart } from 'lucide-react';
import Link from 'next/link';

interface FavoritesListProps {
    favorites: Property[];
}

export default function FavoritesList({ favorites }: FavoritesListProps) {
    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm text-center px-4">
                <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 fill-pink-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Favorites Yet</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    Start exploring properties and click the heart icon to save them here for quick access.
                </p>
                <Link
                    href="/properties"
                    className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                    Browse Properties
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
                <PropertyCard
                    key={property.id}
                    property={property}
                    showMakeOffer={true}
                />
            ))}
        </div>
    );
}

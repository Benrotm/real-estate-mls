import Link from 'next/link';
import Image from 'next/image';
import { Property } from '../lib/properties';
import { Bed, Bath, Ruler, MapPin, Heart } from 'lucide-react';

interface PropertyCardProps {
    property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0,
        }).format(price) + (property.listingType === 'For Rent' ? '/mo' : '');
    };

    return (
        <div className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-none transition-all duration-300 hover:translate-y-1">
            <div className="relative h-64 w-full overflow-hidden">
                <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Badges */}
                <div className="absolute top-4 left-4">
                    {property.listingType === 'For Sale' ? (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                            For Sale
                        </span>
                    ) : (
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                            For Rent
                        </span>
                    )}
                </div>

                {property.isFeatured && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                        Featured
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-white font-bold text-lg flex items-center justify-between">
                        <span>{formatPrice(property.price)}</span>
                        <Heart className="w-5 h-5 hover:fill-red-500 hover:text-red-500 transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>

            <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-600 transition-colors">
                    {property.title}
                </h3>
                <div className="flex items-center text-slate-500 mb-4 text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                    {property.location.city}, {property.location.state}
                </div>

                <div className="grid grid-cols-3 gap-4 py-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Bed className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-sm">{property.specs.beds}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                        <Bath className="w-5 h-5 text-blue-500" />
                        <span className="font-bold text-sm">{property.specs.baths}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                        <Ruler className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-sm">{property.specs.sqft}</span>
                    </div>
                </div>

                <Link
                    href={`/properties/${property.id}`}
                    className="block mt-4 w-full text-center bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 hover:shadow-lg transition-all transform active:scale-95"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
}

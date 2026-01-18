import Link from 'next/link';
import { Bed, Bath, Expand, MapPin, Building } from 'lucide-react';
import { Property } from '@/app/lib/properties';

export default function PropertyCard({ property }: { property: Property }) {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: property.currency || 'USD',
        maximumFractionDigits: 0,
    });

    return (
        <Link href={`/properties/${property.id}`} className="group block h-full">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full flex flex-col transform hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                    <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        <div className={`backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm ${property.listingType === 'For Rent' ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                            {property.listingType}
                        </div>
                        {property.virtualTourUrl && (
                            <div className="bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-1">
                                <span>🎥</span> 360°
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4">
                        <button className="bg-white p-2 rounded-full shadow-md text-gray-400 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5 4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                        </button>
                    </div>

                    {/* Price Tag Overlay (Optional design choice, but PropList puts it in content usually. Let's keep it clean here and put price in content as per design image 1). */}
                    {/* Actually image 1 puts price at bottom left. Image 2 puts price at bottom left. */}
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col">
                    <div className="mb-4">
                        <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1 flex items-center gap-1">
                            <Building className="w-3 h-3" /> {property.specs.type}
                        </div>
                        <h3 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors line-clamp-1 mb-2">{property.title}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="truncate">{property.location.city}, {property.location.state}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-4 h-4 text-gray-400" />
                            <span>{property.specs.beds}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Bath className="w-4 h-4 text-gray-400" />
                            <span>{property.specs.baths}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Expand className="w-4 h-4 text-gray-400" />
                            <span>{property.specs.sqft} sqft</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-2xl font-bold text-secondary">{formatter.format(property.price)}</span>
                            {property.listingType === 'For Rent' && <span className="text-sm text-gray-400 font-medium">/mo</span>}
                        </div>
                        <span className="border border-orange-200 text-primary px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-primary group-hover:text-white transition-all">
                            View Details
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}

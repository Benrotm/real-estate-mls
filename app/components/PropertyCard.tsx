'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Property } from '../lib/properties';
import { Bed, Bath, Ruler, MapPin, Heart, Award, Lock } from 'lucide-react';
import PropertyManageButtons from './PropertyManageButtons';
import { useState } from 'react';
import UpgradeModal from './UpgradeModal';
import FavoriteButton from './property/FavoriteButton';

interface PropertyCardProps {
    property: Property;
    showEditButton?: boolean;
    showMakeOffer?: boolean;
    isMakeOfferLocked?: boolean;
}

export default function PropertyCard({ property, showEditButton, showMakeOffer, isMakeOfferLocked }: PropertyCardProps) {
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0,
        }).format(price) + (property.listing_type === 'For Rent' ? '/mo' : property.listing_type === 'Hotel Regime' ? '/night' : '');
    };

    return (
        <>
            <div className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-none transition-all duration-300 hover:translate-y-1">
                <div className="relative h-64 w-full overflow-hidden">
                    <Image
                        src={property.images[0]}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        {property.status === 'draft' && (
                            <span className="bg-slate-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-slate-500">
                                Draft - Private
                            </span>
                        )}

                        {property.friendly_id && (
                            <span className="bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-slate-700">
                                #{property.friendly_id}
                            </span>
                        )}

                        {property.listing_type === 'For Sale' ? (
                            <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                For Sale
                            </span>
                        ) : property.listing_type === 'Hotel Regime' ? (
                            <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Hotel Regime
                            </span>
                        ) : (
                            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                For Rent
                            </span>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        {property.promoted && (
                            <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                Featured
                            </div>
                        )}
                        {(property.score !== undefined && property.score > 0) && (
                            <div className={`text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1 ${property.score >= 80 ? 'bg-red-600' :
                                property.score >= 50 ? 'bg-orange-500' : 'bg-slate-500'
                                }`}>
                                <Award className="w-3 h-3" /> Score: {property.score}
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="text-white font-bold text-lg flex items-center justify-between">
                            <span>{formatPrice(property.price)}</span>
                            <FavoriteButton propertyId={property.id} className="w-8 h-8 bg-white/20 hover:bg-white text-white relative z-20" />
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-violet-600 transition-colors">
                        {property.title}
                    </h3>
                    <div className="flex items-center text-slate-500 mb-4 text-sm">
                        <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                        {property.location_city}, {property.location_county}
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Bed className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-sm">{property.bedrooms || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                            <Bath className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-sm">{property.bathrooms || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                            <Ruler className="w-4 h-4 text-blue-500" />
                            <span className="font-bold text-sm">{property.area_usable || 0} mp</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Link
                            href={`/properties/${property.id}`}
                            className="flex-1 text-center bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 hover:shadow-lg transition-all transform active:scale-95"
                        >
                            View
                        </Link>
                        {showMakeOffer && (
                            isMakeOfferLocked ? (
                                <button
                                    onClick={() => setIsUpgradeModalOpen(true)}
                                    className="flex-1 text-center bg-slate-100 text-slate-400 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <Lock className="w-3 h-3" />
                                    <span className="text-sm">Make Offer</span>
                                </button>
                            ) : (
                                <Link
                                    href={`/properties/${property.id}#valuation-section`}
                                    className="flex-1 text-center bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 hover:shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-1"
                                >
                                    <span className="text-sm">Make Offer</span>
                                </Link>
                            )
                        )}
                        {showEditButton && (
                            <Link
                                href={`/dashboard/owner/properties/${property.id}/edit`}
                                className="flex-1 text-center bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 hover:shadow-lg transition-all transform active:scale-95"
                            >
                                Edit
                            </Link>
                        )}
                        {showEditButton && (
                            <PropertyManageButtons propertyId={property.id} status={property.status as 'active' | 'draft'} />
                        )}
                    </div>
                </div>
            </div>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="Make an Offer"
                description="This property cannot receive offers because the owner's plan does not support this feature."
            />
        </>
    );
}

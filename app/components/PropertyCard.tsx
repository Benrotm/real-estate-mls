'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Property } from '../lib/properties';
import { Bed, Ruler, MapPin, Heart, Award, Lock, DoorOpen } from 'lucide-react';
import PropertyManageButtons from './PropertyManageButtons';
import { useState } from 'react';
import UpgradeModal from './UpgradeModal';
import FavoriteButton from './property/FavoriteButton';
import { decodeHtmlEntities } from '@/app/lib/utils/string';
import { cleanCityName, sanitizeLocationText } from '@/app/lib/constants/locations';

interface PropertyCardProps {
    property: Property;
    showEditButton?: boolean;
}

export default function PropertyCard({ property, showEditButton }: PropertyCardProps) {

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0,
        }).format(price) + (property.listing_type === 'For Rent' ? '/mo' : property.listing_type === 'Hotel Regime' ? '/night' : '');
    };

    return (
        <>
            <div className="group bg-white rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] hover:shadow-none transition-all duration-300 hover:translate-y-1">
                <div className="relative h-64 w-full overflow-hidden">
                    <Link href={`/properties/${property.id}`}>
                        <Image
                            src={property.images[0]}
                            alt={decodeHtmlEntities(property.title)}
                            fill
                            className="object-cover"
                        />
                    </Link>
                </div>

                <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2">
                            {property.listing_type === 'For Sale' ? (
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-200">
                                    For Sale
                                </span>
                            ) : property.listing_type === 'Hotel Regime' ? (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-purple-200">
                                    Hotel Regime
                                </span>
                            ) : (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-blue-200">
                                    For Rent
                                </span>
                            )}
                            {property.status === 'draft' && (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                                    Draft
                                </span>
                            )}
                            {(property.score !== undefined && property.score > 0) && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border flex items-center gap-1 ${property.score >= 80 ? 'bg-red-50 text-red-700 border-red-100' :
                                    property.score >= 50 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    <Award className="w-3 h-3" /> Score: {property.score}
                                </span>
                            )}
                            {property.promoted && (
                                <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-orange-100">
                                    Featured
                                </span>
                            )}
                        </div>
                        <FavoriteButton propertyId={property.id} className="w-8 h-8 border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50" />
                    </div>

                    <div className="flex justify-between items-end mb-1">
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-violet-600 transition-colors">
                            {decodeHtmlEntities(property.title)}
                        </h3>
                        <span className="text-xl font-black text-slate-900 whitespace-nowrap ml-2">
                            {formatPrice(property.price)}
                        </span>
                    </div>

                    <div className="flex items-center text-slate-500 mb-4 text-sm">
                        <MapPin className="w-4 h-4 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">
                            {cleanCityName(property.location_city || '')}
                            {property.location_area ? ` - ${sanitizeLocationText(property.location_area).cleanText}` : ''}
                            {property.location_county ? `, ${property.location_county}` : ''}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                            <DoorOpen className="w-5 h-5 text-blue-500" />
                            <span className="font-bold text-sm">{property.rooms || 0} rooms</span>
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
                            View Details
                        </Link>
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
        </>
    );
}

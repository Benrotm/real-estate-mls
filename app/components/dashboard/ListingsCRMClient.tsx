'use client';

import { useState } from 'react';
import { PropertyWithOffers, PropertyOffer, updateOfferStatus } from '@/app/lib/actions/offers';
import { Eye, Heart, MessageCircle, DollarSign, ChevronDown, ChevronUp, Check, X, Clock, Edit, ExternalLink, Plus, Building2, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ListingsCRMClientProps {
    properties: PropertyWithOffers[];
}

function formatCurrency(amount: number, currency: string = 'EUR') {
    const symbols: Record<string, string> = { EUR: '€', USD: '$', RON: 'lei' };
    return `${symbols[currency] || currency} ${amount.toLocaleString()}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        viewed: 'bg-blue-100 text-blue-700 border-blue-200',
        accepted: 'bg-green-100 text-green-700 border-green-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
        expired: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${styles[status] || styles.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function OfferRow({ offer, onStatusUpdate }: { offer: PropertyOffer; onStatusUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: 'accepted' | 'rejected' | 'viewed') => {
        setIsUpdating(true);
        await updateOfferStatus(offer.id, newStatus);
        setIsUpdating(false);
        onStatusUpdate();
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                        {offer.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{offer.name || 'Anonymous'}</div>
                        <div className="text-sm text-slate-500">{offer.email || 'No email'}</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-lg text-emerald-600">{formatCurrency(offer.offer_amount, offer.currency)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{formatDate(offer.created_at)}</span>
                    {offer.phone && (
                        <>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500">{offer.phone}</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <StatusBadge status={offer.status} />
                {offer.status === 'pending' && (
                    <div className="flex gap-1 ml-3">
                        <button
                            onClick={() => handleStatusChange('accepted')}
                            disabled={isUpdating}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            title="Accept"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleStatusChange('rejected')}
                            disabled={isUpdating}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            title="Reject"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleStatusChange('viewed')}
                            disabled={isUpdating}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                            title="Mark as viewed"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function PropertyCRMCard({ property }: { property: PropertyWithOffers }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [_, forceUpdate] = useState(0);

    const pendingOffers = property.offers.filter(o => o.status === 'pending').length;
    const acceptedOffers = property.offers.filter(o => o.status === 'accepted').length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            {/* Property Header */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex gap-4">
                    {/* Property Image */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        {property.images?.[0] ? (
                            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-slate-300" />
                            </div>
                        )}
                    </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 truncate">{property.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{property.city}, {property.county}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${property.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {property.is_published ? 'Published' : 'Draft'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="font-bold text-xl text-slate-900">{formatCurrency(property.price, property.currency)}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">{property.listing_type}</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Row */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{property.views_count}</span>
                        <span className="text-xs text-slate-400">views</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="font-bold">{property.favorites_count}</span>
                        <span className="text-xs text-slate-400">saves</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold">{property.inquiries_count}</span>
                        <span className="text-xs text-slate-400">inquiries</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span className="font-bold">{property.offers.length}</span>
                        <span className="text-xs text-slate-400">offers</span>
                        {pendingOffers > 0 && (
                            <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">{pendingOffers} new</span>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            href={`/properties/${property.id}`}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View property"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                            href={`/properties/edit/${property.id}`}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit property"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Offers Section */}
            {property.offers.length > 0 && (
                <div className="border-t border-slate-100">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-amber-500" />
                            {property.offers.length} Offer{property.offers.length !== 1 ? 's' : ''}
                            {pendingOffers > 0 && <span className="text-orange-500">({pendingOffers} pending)</span>}
                            {acceptedOffers > 0 && <span className="text-green-500">({acceptedOffers} accepted)</span>}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                        <div className="px-5 pb-5 space-y-3">
                            {property.offers.map(offer => (
                                <OfferRow
                                    key={offer.id}
                                    offer={offer}
                                    onStatusUpdate={() => forceUpdate(n => n + 1)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ListingsCRMClient({ properties }: ListingsCRMClientProps) {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
                    <p className="text-slate-500 mt-1">{properties.length} properties • {properties.reduce((acc, p) => acc + p.offers.length, 0)} total offers</p>
                </div>
                <Link
                    href="/properties/add"
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4" /> Add Property
                </Link>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{properties.reduce((acc, p) => acc + p.views_count, 0)}</div>
                            <div className="text-xs text-slate-500">Total Views</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Heart className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{properties.reduce((acc, p) => acc + p.favorites_count, 0)}</div>
                            <div className="text-xs text-slate-500">Total Saves</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{properties.reduce((acc, p) => acc + p.inquiries_count, 0)}</div>
                            <div className="text-xs text-slate-500">Total Inquiries</div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{properties.reduce((acc, p) => acc + p.offers.length, 0)}</div>
                            <div className="text-xs text-slate-500">Total Offers</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties List */}
            {properties.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-4">You haven't listed any properties yet.</p>
                    <Link
                        href="/properties/add"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> List Your First Property
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {properties.map((property) => (
                        <PropertyCRMCard key={property.id} property={property} />
                    ))}
                </div>
            )}
        </div>
    );
}

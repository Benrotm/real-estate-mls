'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { respondToCounterOffer, PropertyOffer } from '@/app/lib/actions/offers';
import { 
    DollarSign, 
    Clock, 
    Check, 
    X, 
    AlertCircle, 
    Building, 
    MapPin, 
    MessageSquare, 
    ArrowRight,
    Sparkles,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

interface OfferWithProperty extends PropertyOffer {
    property: {
        id: string;
        title: string;
        price: number;
        currency: string;
        images: string[];
        location_city: string;
        location_county: string;
        friendly_id?: string;
    };
}

interface ClientOffersListProps {
    offers: OfferWithProperty[];
}

export default function ClientOffersList({ offers }: ClientOffersListProps) {
    const router = useRouter();
    const [loadingOfferId, setLoadingOfferId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleResponse = async (offerId: string, accept: boolean) => {
        setLoadingOfferId(offerId);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const res = await respondToCounterOffer(offerId, accept);
            if (res.success) {
                setSuccessMsg(accept ? 'Counter offer accepted successfully!' : 'Counter offer declined.');
                router.refresh();
            } else {
                setErrorMsg(res.error || 'Failed to submit response.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setLoadingOfferId(null);
        }
    };

    if (offers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100 shadow-xl text-center px-6">
                <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-pulse">
                    <DollarSign className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Offers Placed Yet</h3>
                <p className="text-slate-500 max-w-md mb-8">
                    You haven&apos;t placed any offers on properties yet. Start exploring listings to find your dream property and submit an offer!
                </p>
                <Link
                    href="/properties"
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
                >
                    Explore Properties
                </Link>
            </div>
        );
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
            case 'rejected':
                return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
            case 'countered':
                return 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 animate-pulse';
            case 'auctioned':
                return 'bg-fuchsia-500/10 text-fuchsia-600 border border-fuchsia-500/20';
            case 'expired':
                return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
            case 'viewed':
                return 'bg-sky-500/10 text-sky-600 border border-sky-500/20';
            default:
                return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'accepted': return 'Accepted';
            case 'rejected': return 'Rejected';
            case 'countered': return 'Counter Offered';
            case 'auctioned': return 'Moved to Auction';
            case 'expired': return 'Expired';
            case 'viewed': return 'Viewed';
            default: return 'Pending Review';
        }
    };

    return (
        <div className="space-y-6">
            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-sm shadow-sm">
                    <Check className="w-5 h-5 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {offers.map((offer) => {
                    const isCountered = offer.status === 'countered';
                    const mainImage = offer.property?.images?.[0] || '/images/placeholder.jpg';
                    const propUrl = offer.property?.friendly_id 
                        ? `/properties/${offer.property.friendly_id}`
                        : `/properties/${offer.property?.id}`;

                    return (
                        <div 
                            key={offer.id}
                            className={`group relative overflow-hidden bg-white/80 backdrop-blur-md border rounded-3xl transition-all duration-300 shadow-sm hover:shadow-xl ${
                                isCountered 
                                    ? 'border-indigo-200 ring-1 ring-indigo-100/50 shadow-indigo-100/10' 
                                    : 'border-slate-100'
                            }`}
                        >
                            {/* Accent line for countered offers */}
                            {isCountered && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                            )}

                            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:items-center">
                                {/* Property thumbnail */}
                                <div className="relative w-full lg:w-48 h-32 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img 
                                        src={mainImage} 
                                        alt={offer.property?.title || 'Property'} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm ${getStatusStyle(offer.status)}`}>
                                        {getStatusLabel(offer.status)}
                                    </span>
                                </div>

                                {/* Offer details */}
                                <div className="flex-1 min-w-0 space-y-3">
                                    <div>
                                        <Link 
                                            href={propUrl}
                                            className="text-lg font-bold text-slate-900 hover:text-orange-500 transition-colors line-clamp-1 flex items-center gap-1.5"
                                        >
                                            <Building className="w-5 h-5 text-slate-400 shrink-0" />
                                            {offer.property?.title}
                                        </Link>
                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                            {offer.property?.location_city}, {offer.property?.location_county}
                                        </p>
                                    </div>

                                    {/* Financial Breakdown */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2 border-y border-slate-50">
                                        <div>
                                            <span className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider">Property Price</span>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {offer.property?.price?.toLocaleString()} {offer.property?.currency || 'EUR'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[11px] text-slate-400 font-medium uppercase tracking-wider">Your Offer</span>
                                            <span className="text-sm font-extrabold text-orange-500">
                                                {offer.offer_amount.toLocaleString()} {offer.currency}
                                            </span>
                                        </div>
                                        {offer.counter_amount && (
                                            <div>
                                                <span className="block text-[11px] text-indigo-400 font-semibold uppercase tracking-wider flex items-center gap-0.5">
                                                    <Sparkles className="w-3 h-3" /> Counter Offer
                                                </span>
                                                <span className="text-sm font-extrabold text-indigo-600">
                                                    {offer.counter_amount.toLocaleString()} {offer.currency}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {offer.message && (
                                        <div className="text-sm text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-50 flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                            <span className="italic">&ldquo;{offer.message}&rdquo;</span>
                                        </div>
                                    )}

                                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        Placed on {new Date(offer.created_at).toLocaleDateString()} at {new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* Counter response CTA widget */}
                                {isCountered && offer.counter_amount && (
                                    <div className="w-full lg:w-80 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 flex flex-col justify-between shrink-0 gap-4">
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                                                Negotiation Alert
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 line-through">
                                                    {offer.offer_amount.toLocaleString()} {offer.currency}
                                                </span>
                                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                                                <span className="text-base font-black text-indigo-600">
                                                    {offer.counter_amount.toLocaleString()} {offer.currency}
                                                </span>
                                            </div>
                                            {offer.counter_message && (
                                                <p className="text-xs text-indigo-950/85 leading-relaxed bg-white/40 p-2.5 rounded-lg border border-indigo-100/30">
                                                    <span className="font-semibold">Owner message: </span>
                                                    &ldquo;{offer.counter_message}&rdquo;
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => handleResponse(offer.id, true)}
                                                disabled={loadingOfferId !== null}
                                                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {loadingOfferId === offer.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleResponse(offer.id, false)}
                                                disabled={loadingOfferId !== null}
                                                className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                <X className="w-3.5 h-3.5 text-slate-400" />
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

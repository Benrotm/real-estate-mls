'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
    PropertyWithOffers, 
    PropertyOffer, 
    PropertyInquiry, 
    updateOfferStatus, 
    updateInquiryStatus, 
    deleteInquiry,
    counterOffer,
    convertOfferToAuction,
    addOfferToActiveAuction
} from '@/app/lib/actions/offers';
import { getAuctionForProperty, PropertyAuction, createAuction, closeAuction, chooseOffersWinner } from '@/app/lib/actions/auctions';
import { deleteProperty } from '@/app/lib/actions/properties';
import { findMatchingLeads } from '@/app/lib/actions/scoring';
import { startConversationWithUser, sendMessage } from '@/app/lib/actions/chat';
import { LeadData } from '@/app/lib/types';
import ContactPartnerModal from '../ContactPartnerModal';
import {
    Eye, Heart, MessageCircle, DollarSign, Share2,
    ChevronDown, ChevronUp, Check, X, Clock, Edit,
    ExternalLink, Plus, Building2, MapPin, Calendar,
    Award, MessageSquare, Trash2, Zap, User, Phone,
    Mail, AlertCircle, Info, Users, Smartphone, Send,
    Activity, Loader2, Gavel, Sparkles, ArrowRight, Lock,
    Coins, Trophy, HelpCircle, FileText
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PropertyManageButtons from '../PropertyManageButtons';
import LeadProfileDetails from './LeadProfileDetails';

interface ListingsCRMClientProps {
    properties: PropertyWithOffers[];
    headerAction?: React.ReactNode;
    currentUserId?: string;
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
    const s = status || 'pending';
    const styles: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        viewed: 'bg-blue-100 text-blue-700 border-blue-200',
        accepted: 'bg-green-100 text-green-700 border-green-200',
        contacted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
        spam: 'bg-slate-100 text-slate-500 border-slate-200',
        expired: 'bg-gray-100 text-gray-500 border-gray-200',
        countered: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        auctioned: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200'
    };
    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${styles[s] || styles.pending}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
        </span>
    );
}

function OfferRow({ offer, onStatusUpdate }: { offer: PropertyOffer; onStatusUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [activeAuction, setActiveAuction] = useState<PropertyAuction | null>(null);
    const [isLoadingAuction, setIsLoadingAuction] = useState(true);
    const [showCounterForm, setShowCounterForm] = useState(false);
    const [showAuctionForm, setShowAuctionForm] = useState(false);
    
    // Inputs
    const [counterAmount, setCounterAmount] = useState(offer.offer_amount.toString());
    const [counterMessage, setCounterMessage] = useState('');
    const [minIncrement, setMinIncrement] = useState('100');
    
    const getTomorrowDateTimeLocal = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    
    const getWeekLaterDateTimeLocal = () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const [startTime, setStartTime] = useState(getTomorrowDateTimeLocal());
    const [endTime, setEndTime] = useState(getWeekLaterDateTimeLocal());
    
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        const checkAuction = async () => {
            try {
                const auction = await getAuctionForProperty(offer.property_id);
                setActiveAuction(auction);
            } catch (err) {
                console.error('Error fetching active auction for property:', err);
            } finally {
                setIsLoadingAuction(false);
            }
        };
        checkAuction();
    }, [offer.property_id]);

    const handleStatusChange = async (newStatus: 'accepted' | 'rejected' | 'viewed') => {
        setIsUpdating(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        const res = await updateOfferStatus(offer.id, newStatus);
        setIsUpdating(false);
        if (res.success) {
            onStatusUpdate();
        } else {
            setErrorMsg(res.error || 'Failed to update status.');
        }
    };

    const handleCounterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const amount = Number(counterAmount);
            if (isNaN(amount) || amount <= 0) {
                setErrorMsg('Please enter a valid counter-offer amount.');
                setIsUpdating(false);
                return;
            }
            const res = await counterOffer(offer.id, amount, counterMessage);
            if (res.success) {
                setSuccessMsg('Counter offer submitted successfully!');
                setShowCounterForm(false);
                onStatusUpdate();
            } else {
                setErrorMsg(res.error || 'Failed to submit counter offer.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleConvertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const increment = Number(minIncrement);
            if (isNaN(increment) || increment <= 0) {
                setErrorMsg('Please enter a valid minimum increment.');
                setIsUpdating(false);
                return;
            }
            const res = await convertOfferToAuction(
                offer.id,
                increment,
                new Date(startTime).toISOString(),
                new Date(endTime).toISOString()
            );
            if (res.success) {
                setSuccessMsg('Successfully converted offer to open offers!');
                setShowAuctionForm(false);
                onStatusUpdate();
            } else {
                setErrorMsg(res.error || 'Failed to convert offer to open offers.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddToAuction = async () => {
        if (!activeAuction) return;
        setIsUpdating(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            const res = await addOfferToActiveAuction(offer.id, activeAuction.id);
            if (res.success) {
                setSuccessMsg('Successfully placed offer in the active open offers session!');
                onStatusUpdate();
            } else {
                setErrorMsg(res.error || 'Failed to send offer.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    const hasActiveAuction = activeAuction && (activeAuction.status === 'active' || activeAuction.status === 'scheduled');

    return (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                            {offer.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <div className="font-bold text-slate-900">{offer.name || 'Anonymous'}</div>
                            <div className="text-sm text-slate-500">{offer.email || 'No email'}</div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <span className="font-extrabold text-lg text-emerald-600">
                            {formatCurrency(offer.offer_amount, offer.currency)}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">•</span>
                        <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(offer.created_at)}
                        </span>
                        {offer.phone && (
                            <>
                                <span className="text-slate-300 hidden sm:inline">•</span>
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {offer.phone}
                                </span>
                            </>
                        )}
                    </div>

                    {offer.message && (
                        <div className="mt-2 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 italic">
                            &ldquo;{offer.message}&ldquo;
                        </div>
                    )}

                    {/* Show counter details if countered */}
                    {offer.status === 'countered' && offer.counter_amount && (
                        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5" /> Counter Offer Placed
                            </div>
                            <div className="text-sm font-semibold text-indigo-950 flex items-center gap-1.5">
                                Counter Price: <span className="font-bold text-indigo-700">{formatCurrency(offer.counter_amount, offer.currency)}</span>
                            </div>
                            {offer.counter_message && (
                                <p className="text-xs text-indigo-900 italic">&ldquo;{offer.counter_message}&rdquo;</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:self-start">
                    <StatusBadge status={offer.status} />
                    {(offer.status === 'pending' || offer.status === 'viewed') && (
                        <div className="flex flex-wrap gap-1.5 ml-2">
                            <button
                                onClick={() => handleStatusChange('accepted')}
                                disabled={isUpdating}
                                className="p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm"
                                title="Accept"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleStatusChange('rejected')}
                                disabled={isUpdating}
                                className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
                                title="Reject"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {offer.status === 'pending' && (
                                <button
                                    onClick={() => handleStatusChange('viewed')}
                                    disabled={isUpdating}
                                    className="p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm"
                                    title="Mark as viewed"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setShowCounterForm(!showCounterForm);
                                    setShowAuctionForm(false);
                                }}
                                disabled={isUpdating}
                                className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm ${
                                    showCounterForm ? 'bg-indigo-700 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                                }`}
                                title="Counter Offer"
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>

                            {/* Bidding options */}
                            {!isLoadingAuction && (
                                hasActiveAuction ? (
                                    <button
                                        onClick={handleAddToAuction}
                                        disabled={isUpdating}
                                        className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1 text-xs font-bold px-3"
                                        title="Submit to Active Open Offers Session"
                                    >
                                        <Gavel className="w-4 h-4" />
                                        Submit Offer
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowAuctionForm(!showAuctionForm);
                                            setShowCounterForm(false);
                                        }}
                                        disabled={isUpdating}
                                        className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1 text-xs font-bold px-3 ${
                                            showAuctionForm ? 'bg-violet-700 text-white' : 'bg-violet-500 text-white hover:bg-violet-600'
                                        }`}
                                        title="Start Open Offers from this Offer"
                                    >
                                        <Gavel className="w-4 h-4" />
                                        Open Offers
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
            {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                </div>
            )}

            {/* Counter Offer setup form */}
            {showCounterForm && (
                <form onSubmit={handleCounterSubmit} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
                    <div className="text-sm font-bold text-indigo-900 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Negotiate / Counter Offer
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Counter Amount ({offer.currency})</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
                                <input
                                    type="number"
                                    required
                                    value={counterAmount}
                                    onChange={(e) => setCounterAmount(e.target.value)}
                                    placeholder="Enter counter price"
                                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Message to Buyer</label>
                            <input
                                type="text"
                                value={counterMessage}
                                onChange={(e) => setCounterMessage(e.target.value)}
                                placeholder="Explain your pricing (e.g. including furniture)"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowCounterForm(false)}
                            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1"
                        >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Submit Counter
                        </button>
                    </div>
                </form>
            )}

            {/* Convert to Open Offers form */}
            {showAuctionForm && (
                <form onSubmit={handleConvertSubmit} className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl space-y-3 animate-in slide-in-from-top duration-200">
                    <div className="text-sm font-bold text-violet-900 flex items-center gap-1">
                        <Gavel className="w-4 h-4 text-violet-600" /> Start Live Open Offers
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        This starts an open offers session for this property, using this offer's price of <span className="font-bold text-slate-700">{formatCurrency(offer.offer_amount, offer.currency)}</span> as the starting offer.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Recommended increment ({offer.currency})</label>
                            <input
                                type="number"
                                required
                                value={minIncrement}
                                onChange={(e) => setMinIncrement(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Start Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">End Time</label>
                            <input
                                type="datetime-local"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowAuctionForm(false)}
                            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-600/10 flex items-center gap-1"
                        >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gavel className="w-3.5 h-3.5" />}
                            Start Open Offers
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

function InquiryRow({ inquiry, onStatusUpdate }: { inquiry: PropertyInquiry; onStatusUpdate: () => void }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const pathname = usePathname();
    const isAgent = pathname?.includes('/agent/');
    const chatBasePath = isAgent ? '/dashboard/agent/chat' : '/dashboard/owner/chat';

    const handleStatusChange = async (newStatus: 'viewed' | 'contacted' | 'spam') => {
        setIsUpdating(true);
        await updateInquiryStatus(inquiry.id, newStatus);
        setIsUpdating(false);
        onStatusUpdate();
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;
        setIsUpdating(true);
        await deleteInquiry(inquiry.id);
        setIsUpdating(false);
        onStatusUpdate();
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {inquiry.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{inquiry.name}</div>
                        <div className="text-sm text-slate-500">{inquiry.email} {inquiry.phone && `• ${inquiry.phone}`}</div>
                    </div>
                </div>
                <div className="mt-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 italic">
                    "{inquiry.message}"
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(inquiry.created_at)}
                </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
                {inquiry.conversation_id && (
                    <Link
                        href={`${chatBasePath}?id=${inquiry.conversation_id}`}
                        className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 text-xs font-bold mr-2 whitespace-nowrap"
                        title="Open Chat"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat
                    </Link>
                )}
                <StatusBadge status={inquiry.status} />
                <div className="flex gap-1 ml-3">
                    <button
                        onClick={() => handleStatusChange('viewed')}
                        disabled={isUpdating}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        title="Mark as viewed"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleStatusChange('contacted')}
                        disabled={isUpdating}
                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        title="Mark as contacted"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isUpdating}
                        className="p-2 bg-slate-200 text-slate-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                        title="Delete inquiry"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function PropertyCRMCard({ property, currentUserId }: { property: PropertyWithOffers; currentUserId?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isInquiriesExpanded, setIsInquiriesExpanded] = useState(false);
    const [isMatchesExpanded, setIsMatchesExpanded] = useState(false);
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
    const [expandedMatchedLeadId, setExpandedMatchedLeadId] = useState<string | null>(null);
    const [_, forceUpdate] = useState(0);

    // Contact Partner Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [selectedLeadForContact, setSelectedLeadForContact] = useState<any>(null);

    // Open Offers Management Modal State
    const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
    const [auctionData, setAuctionData] = useState<PropertyAuction | null>(property.auction || null);
    const [isLoadingAuctionData, setIsLoadingAuctionData] = useState(false);
    const [offersFormError, setOffersFormError] = useState<string | null>(null);
    const [offersFormSuccess, setOffersFormSuccess] = useState<string | null>(null);
    const [isOffersPending, startOffersTransition] = useTransition();
    const [showInfoPopup, setShowInfoPopup] = useState(false);

    // Owner start form input states
    const [startStartingPrice, setStartStartingPrice] = useState<string>(String(property.price));
    const [startMinIncrement, setStartMinIncrement] = useState<string>('500');
    const [startDurationDays, setStartDurationDays] = useState<string>('7');
    const [confirmClose, setConfirmClose] = useState<boolean>(false);

    // Dynamic Costs State
    const [openOffersStartCost, setOpenOffersStartCost] = useState<number>(5);
    const [openOffersSubmitCost, setOpenOffersSubmitCost] = useState<number>(1);
    const [openOffersCancelCost, setOpenOffersCancelCost] = useState<number>(10);

    const handleOpenOffersModal = async () => {
        setIsOffersModalOpen(true);
        setIsLoadingAuctionData(true);
        setOffersFormError(null);
        setOffersFormSuccess(null);
        try {
            const data = await getAuctionForProperty(property.id);
            setAuctionData(data);
            if (data) {
                setStartStartingPrice(String(data.starting_price));
                setStartMinIncrement(String(data.min_increment));
            }
            const { getFeatureCosts } = await import('@/app/lib/actions/settings');
            const res = await getFeatureCosts();
            if (res && res.costs) {
                if (res.costs['open_offers_start'] !== undefined) {
                    setOpenOffersStartCost(res.costs['open_offers_start']);
                }
                if (res.costs['open_offers_submit'] !== undefined) {
                    setOpenOffersSubmitCost(res.costs['open_offers_submit']);
                }
                if (res.costs['open_offers_cancel'] !== undefined) {
                    setOpenOffersCancelCost(res.costs['open_offers_cancel']);
                }
            }
        } catch (err) {
            console.error(err);
            setOffersFormError('Failed to load open offers data.');
        } finally {
            setIsLoadingAuctionData(false);
        }
    };

    const handleStartOffers = async (e: React.FormEvent) => {
        e.preventDefault();
        setOffersFormError(null);
        setOffersFormSuccess(null);

        const price = Number(startStartingPrice);
        const increment = Number(startMinIncrement);
        const duration = Number(startDurationDays);

        if (isNaN(price) || price <= 0) {
            setOffersFormError('Starting price must be a positive number.');
            return;
        }
        if (isNaN(increment) || increment < 0) {
            setOffersFormError('Recommended increment must be a non-negative number.');
            return;
        }

        startOffersTransition(async () => {
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
            const res = await createAuction(
                property.id,
                price,
                null,
                increment,
                now.toISOString(),
                endTime.toISOString()
            );
            if (res.success) {
                setOffersFormSuccess('Live Open Offers started successfully!');
                const updatedData = await getAuctionForProperty(property.id);
                setAuctionData(updatedData);
                router.refresh();
            } else {
                setOffersFormError(res.error || 'Failed to start Live Open Offers.');
            }
        });
    };

    const handleCloseOffers = async () => {
        if (!auctionData) return;
        if (!confirmClose) {
            setConfirmClose(true);
            setTimeout(() => setConfirmClose(false), 3000);
            return;
        }

        setConfirmClose(false);
        setOffersFormError(null);
        setOffersFormSuccess(null);

        startOffersTransition(async () => {
            const res = await closeAuction(auctionData.id);
            if (res.success) {
                setOffersFormSuccess('Live Open Offers session closed successfully!');
                const updatedData = await getAuctionForProperty(property.id);
                setAuctionData(updatedData);
                router.refresh();
            } else {
                setOffersFormError(res.error || 'Failed to close open offers session.');
            }
        });
    };

    const handleSelectWinner = async (bidId: string, amount: number, bidderName: string | undefined) => {
        if (!auctionData) return;
        if (!confirm(`Sunteți sigur că doriți să alegeți oferta de ${amount} EUR a lui ${bidderName || 'anonim'} ca fiind câștigătoare? Această acțiune va închide sesiunea și creditele nu vor fi returnate.`)) {
            return;
        }

        setOffersFormError(null);
        setOffersFormSuccess(null);

        startOffersTransition(async () => {
            const res = await chooseOffersWinner(auctionData.id, bidId);
            if (res.success) {
                setOffersFormSuccess('Câștigătorul a fost selectat și notificat cu succes!');
                const updatedData = await getAuctionForProperty(property.id);
                setAuctionData(updatedData);
                router.refresh();
            } else {
                setOffersFormError(res.error || 'Eroare la selectarea câștigătorului.');
            }
        });
    };

    const handleLoadMatches = async () => {
        setIsMatchingLoading(true);
        setMatchError(null);
        try {
            const results = await findMatchingLeads(property.id);
            setMatchingLeads(results);
        } catch (err) {
            setMatchError('Failed to load matching leads.');
            console.error(err);
        } finally {
            setIsMatchingLoading(false);
        }
    };

    const toggleMatches = () => {
        setIsMatchesExpanded(!isMatchesExpanded);
    };

    const toggleExpandMatchedLead = (id: string) => {
        setExpandedMatchedLeadId(prev => prev === id ? null : id);
    };

    const handleWhatsAppLead = (lead: LeadData) => {
        const message = `Hello ${lead.name},\n\nI found a property that matches your requirements: ${property.title}\nPrice: ${property.price.toLocaleString()} ${property.currency}\nLink: ${window.location.origin}/properties/${property.id}`;
        const encoded = encodeURIComponent(message);
        const phone = lead.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    };

    const handleEmailLead = (lead: LeadData) => {
        const subject = encodeURIComponent(`Property Match: ${property.title}`);
        const body = encodeURIComponent(`Hello ${lead.name},\n\nI found a property that matches your requirements: ${property.title}\nPrice: ${property.price.toLocaleString()} ${property.currency}\nLink: ${window.location.origin}/properties/${property.id}`);
        window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    };

    const handleContactPartner = (lead: any) => {
        if (!lead.agent?.id) {
            alert('Partner contact info not available.');
            return;
        }
        setSelectedLeadForContact(lead);
        setIsContactModalOpen(true);
    };

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
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-lg text-slate-900 truncate" title={property.title}>{property.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 truncate">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{property.city}, {property.county}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end shrink-0 pl-2">
                                {property.status === 'draft' && (
                                    <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-500 shrink-0">
                                        Draft - Private
                                    </span>
                                )}
                                {property.status === 'active' && (() => {
                                    const publishedDate = property.published_at ? new Date(property.published_at) : new Date(property.created_at);
                                    const diffTime = new Date().getTime() - publishedDate.getTime();
                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                    const remainingDays = Math.max(0, 30 - diffDays);
                                    
                                    let badgeColor = 'bg-emerald-600';
                                    let pulseClass = '';
                                    if (remainingDays <= 5) {
                                        badgeColor = 'bg-red-500';
                                        pulseClass = 'animate-pulse';
                                    } else if (remainingDays <= 10) {
                                        badgeColor = 'bg-amber-500';
                                    }
                                    
                                    return (
                                        <span className={`${badgeColor} ${pulseClass} text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
                                            {remainingDays} {remainingDays === 1 ? 'Zi Rămasă' : 'Zile Rămase'}
                                        </span>
                                    );
                                })()}
                                {property.friendly_id && (
                                    <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-700 shrink-0">
                                        #{property.friendly_id}
                                    </span>
                                )}
                                {property.promoted && (
                                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                        Featured
                                    </span>
                                )}
                                {property.score && property.score > 0 && (
                                    <span className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 ${property.score >= 80 ? 'bg-red-600' : property.score >= 50 ? 'bg-orange-500' : 'bg-slate-500'}`}>
                                        <Award className="w-2.5 h-2.5" /> Score: {property.score}
                                    </span>
                                )}
                                {property.features?.includes('Open to Collaboration') && (
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 shadow-sm shadow-indigo-500/20">
                                        Collab
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="font-bold text-xl text-slate-900">{formatCurrency(property.price, property.currency)}</span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase">{property.listing_type}</span>
                        </div>
                    </div>
                </div>

                {/* Analytics Row */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 overflow-x-auto pb-3 md:pb-0 no-scrollbar">
                    <div className="flex items-center gap-2 text-slate-600 shrink-0">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{property.views_count}</span>
                        <span className="text-xs text-slate-400">views</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 shrink-0">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="font-bold">{property.favorites_count}</span>
                        <span className="text-xs text-slate-400">saves</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 shrink-0">
                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold">{property.inquiries_count}</span>
                        <span className="text-xs text-slate-400">inquiries</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 shrink-0">
                        <DollarSign className="w-4 h-4 text-amber-500" />
                        <span className="font-bold">{property.offers.length}</span>
                        <span className="text-xs text-slate-400">offers</span>
                        {pendingOffers > 0 && (
                            <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full shrink-0">{pendingOffers} new</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 shrink-0">
                        <Share2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold">{property.shares_count || 0}</span>
                        <span className="text-xs text-slate-400">shares</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenOffersModal();
                            }}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition duration-150 relative z-10 flex items-center gap-1.5 cursor-pointer ${
                                property.auction && property.auction.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : property.auction && property.auction.status === 'scheduled'
                                    ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                            }`}
                            title="Manage Live Open Offers"
                        >
                            <Gavel className="w-3.5 h-3.5" />
                            <span>
                                {property.auction && property.auction.status === 'active'
                                    ? 'Live Offers: Active'
                                    : property.auction && property.auction.status === 'scheduled'
                                    ? 'Live Offers: Scheduled'
                                    : 'Start Open Offers'}
                            </span>
                            {property.auction && (property.auction.status === 'active' || property.auction.status === 'scheduled') && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                            )}
                        </button>
                        <Link
                            href={`/properties/${property.id}`}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View property"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                            href={`/dashboard/agent/presentation-contracts/generate?property_id=${property.id}`}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Contract de vizionare"
                        >
                            <FileText className="w-4 h-4" />
                        </Link>
                        <Link
                            href={pathname?.includes('/dashboard/admin')
                                ? `/dashboard/admin/properties/${property.id}/edit`
                                : `/dashboard/owner/properties/${property.id}/edit`
                            }
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mr-2"
                            title="Edit property"
                        >
                            <Edit className="w-4 h-4" />
                        </Link>

                        <button
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                                    try {
                                        // Simple optimistic update or just reload
                                        const res = await deleteProperty(property.id);
                                        if (res.error) {
                                            alert(`Error: ${res.error}`);
                                        } else {
                                            router.refresh();
                                        }
                                    } catch (e) {
                                        alert('Failed to delete property');
                                    }
                                }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-2 cursor-pointer relative z-10"
                            title="Delete property"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="w-32 scale-90 origin-right">
                            {/* Wrap PropertyManageButtons to match size */}
                            <PropertyManageButtons
                                propertyId={property.id}
                                status={property.status as 'active' | 'draft'}
                            />
                        </div>
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
            {/* Inquiries Section */}
            {property.inquiries.length > 0 && (
                <div className="border-t border-slate-100">
                    <button
                        onClick={() => setIsInquiriesExpanded(!isInquiriesExpanded)}
                        className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-emerald-500" />
                            {property.inquiries.length} Inquir{property.inquiries.length !== 1 ? 'ies' : 'y'}
                            {property.inquiries.some(i => i.status === 'pending') && (
                                <span className="text-orange-500">
                                    ({property.inquiries.filter(i => i.status === 'pending').length} pending)
                                </span>
                            )}
                        </span>
                        {isInquiriesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isInquiriesExpanded && (
                        <div className="px-5 pb-5 space-y-3">
                            {property.inquiries.map(inquiry => (
                                <InquiryRow
                                    key={inquiry.id}
                                    inquiry={inquiry}
                                    onStatusUpdate={() => forceUpdate(n => n + 1)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Matching Section */}
            <div className="border-t border-slate-100">
                <button
                    onClick={toggleMatches}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500 fill-current" />
                        AI Matched Leads
                    </span>
                    {isMatchesExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isMatchesExpanded && (
                    <div className="px-5 pb-5">
                        {matchingLeads.length === 0 && !isMatchingLoading && !matchError ? (
                            <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-orange-50">
                                    <Zap className="w-8 h-8 text-orange-600 animate-pulse" />
                                </div>
                                <h3 className="text-slate-900 font-black text-lg mb-2">Ready to find buyers?</h3>
                                <p className="text-slate-500 text-sm max-w-xs mb-6 font-medium">
                                    Our AI engine will analyze your property and match it against our entire lead database.
                                </p>
                                <button
                                    onClick={handleLoadMatches}
                                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-orange-500/25 flex items-center gap-3 active:scale-95"
                                >
                                    <Zap className="w-4 h-4 fill-current" />
                                    START AI MATCH SCAN
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-4">
                                    <button
                                        onClick={() => setFilterMode('all')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        All Compatible
                                    </button>
                                    <button
                                        onClick={() => setFilterMode('my')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filterMode === 'my' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        My Leads Only
                                    </button>
                                </div>

                                {isMatchingLoading ? (
                                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                                        <Activity className="w-6 h-6 text-orange-500 animate-pulse" />
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Scanning leads for compatibility...</p>
                                    </div>
                                ) : matchError ? (
                                    <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-center">
                                        <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                        <p className="text-red-700 text-sm font-bold">{matchError}</p>
                                        <button onClick={handleLoadMatches} className="mt-2 text-xs font-black text-red-600 underline uppercase">Retry Scan</button>
                                    </div>
                                ) : (() => {
                                    const filtered = matchingLeads.filter(l => filterMode === 'all' || l.agent_id === currentUserId);

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                <p className="text-slate-500 font-bold text-sm">No compatible leads found.</p>
                                                <p className="text-slate-400 text-xs mt-1">Try adjusting matching rules in Superadmin.</p>
                                                <button onClick={handleLoadMatches} className="mt-4 text-xs font-black text-orange-600 underline uppercase">Scan Again</button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-3">
                                            {filtered.map((lead) => {
                                                const isOwnLead = lead.agent_id === currentUserId;
                                                return (
                                                    <div key={lead.id} className={`bg-white border transition-all group overflow-hidden ${expandedMatchedLeadId === lead.id ? 'border-orange-300 ring-2 ring-orange-400/20 shadow-md rounded-2xl' : 'border-slate-100 hover:border-orange-200 hover:shadow-md rounded-xl'}`}>
                                                        <div 
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer"
                                                            onClick={() => toggleExpandMatchedLead(lead.id)}
                                                        >
                                                            <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${isOwnLead ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {isOwnLead ? (lead.name?.charAt(0).toUpperCase() || '?') : <User className="w-6 h-6" />}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-900">
                                                                            {isOwnLead ? lead.name : 'Partner Lead'}
                                                                        </span>
                                                                        <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-lg shadow-sm">
                                                                            {lead.match_score} pts
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                                                        {isOwnLead ? (
                                                                            <>
                                                                                <Smartphone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone || 'No phone'}
                                                                                <span className="mx-1">•</span>
                                                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email || 'No email'}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Users className="w-3.5 h-3.5 text-indigo-500" /> Agent: {lead.agent?.full_name || 'Anonymous Partner'}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isOwnLead ? (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleWhatsAppLead(lead); }}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                                        >
                                                                            <Send className="w-3.5 h-3.5" /> WhatsApp
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleEmailLead(lead); }}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                                        >
                                                                            <Mail className="w-3.5 h-3.5" /> Email
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleContactPartner(lead); }}
                                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
                                                                    >
                                                                        <MessageSquare className="w-3.5 h-3.5" /> Contact Partner
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleExpandMatchedLead(lead.id); }}
                                                                    className={`p-2 rounded-lg transition-colors border ${expandedMatchedLeadId === lead.id ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-100 hover:border-slate-300'}`}
                                                                    title={expandedMatchedLeadId === lead.id ? "Hide Details" : "Show Details"}
                                                                >
                                                                    {expandedMatchedLeadId === lead.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Profile Details */}
                                                        {expandedMatchedLeadId === lead.id && (
                                                            <div className="bg-slate-50 border-t border-slate-100 pb-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="p-2 sm:p-5">
                                                                    <LeadProfileDetails lead={lead} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}
            </div>
            {/* Contact Partner Modal */}
            {selectedLeadForContact && (
                <ContactPartnerModal
                    isOpen={isContactModalOpen}
                    onClose={() => {
                        setIsContactModalOpen(false);
                        setSelectedLeadForContact(null);
                    }}
                    partnerId={selectedLeadForContact.agent?.id}
                    partnerName={selectedLeadForContact.agent?.full_name || 'Partner Agent'}
                    defaultMessage={`Hi! I noticed a match between my property (${property.friendly_id || property.id}) and your lead. Let's collaborate!`}
                    currentUserEmail={null}
                    currentUserId={currentUserId || null}
                />
            )}

            {/* Open Offers Management Modal */}
            {isOffersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-violet-500" />
                                Manage Open Offers
                            </h3>
                            <button
                                onClick={() => setIsOffersModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                            {/* Error & Success Messages */}
                            {offersFormError && (
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{offersFormError}</span>
                                </div>
                            )}

                            {offersFormSuccess && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
                                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{offersFormSuccess}</span>
                                </div>
                            )}

                            {/* Educational Info Section */}
                            <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Info className="w-4 h-4 text-blue-500" /> Sistemul de Garantare prin Credite
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => setShowInfoPopup(!showInfoPopup)}
                                        className="text-blue-500 hover:underline font-bold"
                                    >
                                        {showInfoPopup ? 'Ascunde' : 'Vezi detalii'}
                                    </button>
                                </div>
                                {showInfoPopup && (
                                    <div className="text-slate-500 dark:text-slate-400 leading-relaxed space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
                                        <p>
                                            Pentru protecția utilizatorilor, activarea unei sesiuni și trimiterea ofertelor consumă credite:
                                        </p>
                                        <ul className="list-disc pl-4 space-y-1 mt-1">
                                            <li><strong>Deschidere:</strong> Proprietarul folosește <span className="font-extrabold text-slate-800 dark:text-slate-200">{openOffersStartCost} credite</span> pentru deschiderea sesiunii.</li>
                                            <li><strong>Oferte:</strong> Fiecare ofertă trimisă costă <span className="font-extrabold text-slate-800 dark:text-slate-200">{openOffersSubmitCost} credite</span> pentru ofertant pentru a evita ofertele false fara interes real.</li>
                                            <li><strong>Anulare Sesiune:</strong> Dacă proprietarul închide manual sesiunea fără a alege un câștigător, acesta plătește o taxă de anulare de <span className="font-extrabold text-rose-600 dark:text-rose-400">{openOffersCancelCost} credite</span>, iar toate creditele ofertanților sunt returnate automat.</li>
                                            <li><strong>Selectare Câștigător:</strong> Dacă proprietarul alege o ofertă câștigătoare, sesiunea se încheie normal: creditele nu se returnează, iar proprietarul nu plătește taxa de anulare.</li>
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {isLoadingAuctionData ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Loading session data...</p>
                                </div>
                            ) : auctionData && (auctionData.status === 'active' || auctionData.status === 'scheduled' || auctionData.status === 'ended') ? (
                                /* Active Open Offers Session */
                                <div className="space-y-4">
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                            </span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {auctionData.status === 'active' ? 'Live Open Offers Active' : auctionData.status === 'scheduled' ? 'Upcoming Open Offers Scheduled' : 'Open Offers Completed'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-mono">
                                            Starts: {new Date(auctionData.start_time).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Starting Offer Price</span>
                                            <span className="text-2xl font-black">{formatCurrency(auctionData.starting_price, property.currency)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-0.5">Recommended Increment</span>
                                            <span className="text-sm font-bold text-orange-400">+{formatCurrency(auctionData.min_increment, property.currency)}</span>
                                        </div>
                                    </div>

                                    {auctionData.winner_bid_id ? (
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-800 dark:text-yellow-400 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500 animate-bounce shrink-0" />
                                            <div>
                                                Sesiune finalizată! Câștigător selectat.
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleCloseOffers}
                                            disabled={isOffersPending}
                                            className={`w-full py-3.5 px-6 rounded-2xl font-bold tracking-wide shadow-lg transition duration-150 flex items-center justify-center gap-2 ${
                                                confirmClose 
                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 animate-pulse'
                                                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                                            }`}
                                        >
                                            <Lock className="w-4 h-4" />
                                            {confirmClose ? 'Confirm Close Open Offers?' : `Close Open Offers Session (Penalty: ${openOffersCancelCost} CR)`}
                                        </button>
                                    )}

                                    {/* Bids history and winner selection */}
                                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Oferte primite în această sesiune ({auctionData.bids?.length || 0})
                                        </h4>
                                        
                                        {!auctionData.bids || auctionData.bids.length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                                                Nu s-au primit oferte în această sesiune.
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                                {auctionData.bids.map((bid) => {
                                                    const isWinner = auctionData.winner_bid_id === bid.id;
                                                    const hasWinner = !!auctionData.winner_bid_id;
                                                    return (
                                                        <div 
                                                            key={bid.id} 
                                                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all duration-200 ${
                                                                isWinner 
                                                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-400 font-bold'
                                                                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                                            }`}
                                                        >
                                                            <div className="space-y-0.5">
                                                                <div className="font-bold flex items-center gap-1 text-slate-800 dark:text-slate-200">
                                                                    {isWinner && <Trophy className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                                                                    {bid.user_name || 'Ofertant Anonim'}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-medium">
                                                                    {new Date(bid.created_at).toLocaleString('ro-RO')}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="font-black text-slate-900 dark:text-white">
                                                                    {Number(bid.bid_amount).toLocaleString()} EUR
                                                                </span>
                                                                
                                                                {!hasWinner && (auctionData.status === 'active' || auctionData.status === 'ended') && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSelectWinner(bid.id, bid.bid_amount, bid.user_name)}
                                                                        disabled={isOffersPending}
                                                                        className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold rounded-lg transition-colors cursor-pointer text-[10px] shadow hover:shadow-md"
                                                                    >
                                                                        Alege
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Start Live Open Offers Form */
                                <form onSubmit={handleStartOffers} className="space-y-4">
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Create a Live Open Offers session for this property. Users will be able to make offers dynamically from the public listing page.
                                    </p>

                                    <div>
                                        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                                            Starting Offer Price ({property.currency})
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            step="1"
                                            value={startStartingPrice}
                                            onChange={(e) => setStartStartingPrice(e.target.value)}
                                            disabled={isOffersPending}
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-black text-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition disabled:opacity-50"
                                            placeholder="e.g. 150000"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                                            Recommended increment ({property.currency})
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="1"
                                            value={startMinIncrement}
                                            onChange={(e) => setStartMinIncrement(e.target.value)}
                                            disabled={isOffersPending}
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold text-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition disabled:opacity-50"
                                            placeholder="e.g. 500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                                            Duration (Days)
                                        </label>
                                        <select
                                            value={startDurationDays}
                                            onChange={(e) => setStartDurationDays(e.target.value)}
                                            disabled={isOffersPending}
                                            className="w-full bg-slate-50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold text-md focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition disabled:opacity-50"
                                        >
                                            <option value="1">1 Day</option>
                                            <option value="3">3 Days</option>
                                            <option value="5">5 Days</option>
                                            <option value="7">7 Days</option>
                                            <option value="14">14 Days</option>
                                            <option value="30">30 Days</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isOffersPending}
                                        className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide shadow-lg shadow-orange-500/20 active:scale-98 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isOffersPending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Starting Open Offers...
                                            </>
                                        ) : (
                                            <>
                                                <Gavel className="w-4 h-4" />
                                                Start Live Open Offers (Cost: {openOffersStartCost} CR)
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ListingsCRMClient({ properties, headerAction, currentUserId }: ListingsCRMClientProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);

    const totalCount = properties.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const startIdx = (currentPage - 1) * perPage;
    const visibleProperties = properties.slice(startIdx, startIdx + perPage);

    // Reset page when perPage changes
    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1);
    };

    // Build page numbers (max 7 with ellipsis)
    const buildPageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
                    <p className="text-slate-500 mt-1">{totalCount} properties • {properties.reduce((acc, p) => acc + p.offers.length, 0)} total offers</p>
                </div>
                <div className="flex items-center gap-3">
                    {headerAction}
                    <Link
                        href="/properties/add"
                        className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Property
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{properties.reduce((acc, p) => acc + p.shares_count, 0)}</div>
                            <div className="text-xs text-slate-500">Total Shares</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-page selector and total counter */}
            <div className="mb-4 flex items-center justify-between">
                <span className="font-bold text-slate-700">
                    {totalCount} Properties Found
                </span>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>Show</span>
                    <select
                        value={perPage}
                        onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none cursor-pointer"
                    >
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span>per page</span>
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
                <>
                    <div className="space-y-4">
                        {visibleProperties.map((property) => (
                            <PropertyCRMCard key={property.id} property={property} currentUserId={currentUserId} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-10">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage <= 1}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                            >
                                Prev
                            </button>
                            {buildPageNumbers().map((page, i) =>
                                page === '...' ? (
                                    <span key={`e-${i}`} className="px-2 py-2 text-slate-400 text-sm">…</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`min-w-[36px] h-9 rounded-lg text-sm font-bold cursor-pointer transition-all ${page === currentPage
                                            ? 'bg-violet-600 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-110'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                disabled={currentPage >= totalPages}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


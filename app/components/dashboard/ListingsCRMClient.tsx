'use client';

import { useState } from 'react';
import { PropertyWithOffers, PropertyOffer, PropertyInquiry, updateOfferStatus, updateInquiryStatus, deleteInquiry } from '@/app/lib/actions/offers';
import { deleteProperty } from '@/app/lib/actions/properties';
import { findMatchingLeads } from '@/app/lib/actions/scoring';
import { startConversationWithUser, sendMessage } from '@/app/lib/actions/chat';
import { LeadData } from '@/app/lib/types';
import {
    Eye, Heart, MessageCircle, DollarSign, Share2,
    ChevronDown, ChevronUp, Check, X, Clock, Edit,
    ExternalLink, Plus, Building2, MapPin, Calendar,
    Award, MessageSquare, Trash2, Zap, User, Phone,
    Mail, AlertCircle, Info, Users, Smartphone, Send,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PropertyManageButtons from '../PropertyManageButtons';

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
        expired: 'bg-gray-100 text-gray-500 border-gray-200'
    };
    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full border ${styles[s] || styles.pending}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [isInquiriesExpanded, setIsInquiriesExpanded] = useState(false);
    const [isMatchesExpanded, setIsMatchesExpanded] = useState(false);
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
    const [_, forceUpdate] = useState(0);

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

    const handleContactPartner = async (lead: any) => {
        if (!lead.agent?.id) {
            alert('Partner contact info not available.');
            return;
        }

        try {
            const { conversationId, error } = await startConversationWithUser(lead.agent.id);
            if (error) throw new Error(error);

            if (conversationId) {
                const message = `Hi! I noticed a match between my property (${property.id}) and your lead (${lead.id}). Let's collaborate!`;
                await sendMessage(conversationId, currentUserId!, message);
                router.push(`/dashboard/agent/chat?id=${conversationId}`);
            }
        } catch (err) {
            console.error('Error starting partner chat:', err);
            alert('Failed to start chat with partner.');
        }
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
                    <div className="flex items-center gap-2 text-slate-600">
                        <Share2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold">{property.shares_count || 0}</span>
                        <span className="text-xs text-slate-400">shares</span>
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
                            href={`/dashboard/owner/properties/${property.id}/edit`}
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
                                                    <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-orange-200 hover:shadow-md transition-all group">
                                                        <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black ${isOwnLead ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                {isOwnLead ? (lead.name?.charAt(0).toUpperCase() || '?') : <User className="w-6 h-6" />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-900">
                                                                        {isOwnLead ? lead.name : 'Partner Lead'}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-black rounded-lg">
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
                                                                        onClick={() => handleWhatsAppLead(lead)}
                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                                    >
                                                                        <Send className="w-3.5 h-3.5" /> WhatsApp
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEmailLead(lead)}
                                                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        <Mail className="w-3.5 h-3.5" /> Email
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleContactPartner(lead)}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
                                                                >
                                                                    <MessageSquare className="w-3.5 h-3.5" /> Contact Partner
                                                                </button>
                                                            )}
                                                            <Link
                                                                href={`/dashboard/agent/leads?id=${lead.id}`}
                                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                                                                title="View Requirements"
                                                            >
                                                                <Info className="w-4 h-4" />
                                                            </Link>
                                                        </div>
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


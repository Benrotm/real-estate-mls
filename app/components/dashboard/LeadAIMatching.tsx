'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, CheckCircle, AlertCircle, Building2, Zap, ArrowUpRight, MessageSquare, Activity, MapPin, BookmarkPlus, XCircle, ListFilter } from 'lucide-react';
import { LeadData } from '@/app/lib/types';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { upsertMatchStatus } from '@/app/lib/actions/matches';
import ContactPartnerModal from '../ContactPartnerModal';
import { useRouter } from 'next/navigation';

interface Props {
    lead: LeadData;
    currentUserId?: string;
}

export default function LeadAIMatching({ lead, currentUserId }: Props) {
    const router = useRouter();
    const [matches, setMatches] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);
    const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [selectedPartnerForContact, setSelectedPartnerForContact] = useState<any>(null);
    const [modalDefaultMessage, setModalDefaultMessage] = useState('');

    const handleLoadMatches = async () => {
        setIsMatchingLoading(true);
        setMatchError(null);
        setHasScanned(true);
        setSelectedPropertyIds([]);
        try {
            if (!lead.id) return;
            const results = await findMatchingProperties(lead.id);
            setMatches(results);
        } catch (err) {
            setMatchError('Failed to load matching properties.');
            console.error(err);
        } finally {
            setIsMatchingLoading(false);
        }
    };

    const togglePropertySelection = (id: string) => {
        setSelectedPropertyIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleQuickAction = async (propertyId: string, status: 'saved' | 'dismissed', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!lead.id) return;

        setSavingStates(prev => ({ ...prev, [propertyId]: true }));
        try {
            await upsertMatchStatus(lead.id, propertyId, status);
            // Optionally remove from view if dismissed
            if (status === 'dismissed') {
                setMatches(prev => prev.filter(m => m.id !== propertyId));
            } else {
                alert('Property saved to matches list!');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save status');
        } finally {
            setSavingStates(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    const handleContactPartner = (property: any) => {
        if (!property.owner?.id) {
            alert('Partner contact info not available.');
            return;
        }
        setSelectedPartnerForContact({
            id: property.owner.id,
            full_name: property.owner.full_name || 'Partner Agent'
        });
        setModalDefaultMessage(`Hi! I noticed a match between my lead (${lead.id}) and your property (${property.friendly_id || property.id}). Let's collaborate!`);
        setIsContactModalOpen(true);
    };

    const handleShareWhatsApp = () => {
        if (selectedPropertyIds.length === 0) return;
        const selectedMatches = matches.filter(m => selectedPropertyIds.includes(m.id));
        const message = `Hello ${lead.name},\n\nI found some properties that match your requirements:\n\n` +
            selectedMatches.map(m => `* ${m.title}\n  Price: ${m.price.toLocaleString()} ${m.currency}\n  Link: ${window.location.origin}/properties/${m.id}`).join('\n\n') +
            `\n\nLet me know if you are interested!`;

        const encoded = encodeURIComponent(message);
        const phone = lead.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    };

    const handleShareEmail = () => {
        if (selectedPropertyIds.length === 0) return;
        const selectedMatches = matches.filter(m => selectedPropertyIds.includes(m.id));
        const subject = encodeURIComponent('Property Matches for You');
        const body = encodeURIComponent(`Hello ${lead.name},\n\nI found some properties that match your requirements:\n\n` +
            selectedMatches.map(m => `${m.title}\nPrice: ${m.price.toLocaleString()} ${m.currency}\nLink: ${window.location.origin}/properties/${m.id}`).join('\n\n') +
            `\n\nLet me know if you are interested!`);

        window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-600/20">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">AI Matching Properties</h4>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Showing top compatible properties from inventory</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {selectedPropertyIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-green-600/20"
                                >
                                    <Phone className="w-4 h-4" /> Share WhatsApp ({selectedPropertyIds.length})
                                </button>
                                <button
                                    onClick={handleShareEmail}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
                                >
                                    <Mail className="w-4 h-4" /> Share Email
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => router.push(`/dashboard/agent/leads/${lead.id}/matches`)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-slate-900/20"
                        >
                            <ListFilter className="w-4 h-4" />
                            Manage & Share
                        </button>
                    </div>
                </div>

                {!hasScanned && !isMatchingLoading ? (
                    <div className="py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-orange-50 rotate-3 transition-transform duration-500">
                            <Zap className="w-10 h-10 text-orange-600 fill-current" />
                        </div>
                        <h3 className="text-slate-900 font-black text-xl mb-2">Find the Perfect Property</h3>
                        <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium">
                            Our AI engine will analyze this lead's specific requirements and scan your entire inventory for the highest compatibility matches.
                        </p>
                        <button
                            onClick={handleLoadMatches}
                            className="px-10 py-4 bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-orange-600/25 flex items-center gap-4 active:scale-95 group"
                        >
                            <Zap className="w-5 h-5 fill-current group-hover:animate-pulse" />
                            START AI MATCH SCAN
                        </button>
                    </div>
                ) : (
                    <>
                        {isMatchingLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
                                <p className="text-slate-500 text-sm font-bold animate-pulse uppercase tracking-widest">Scanning inventory for best matches...</p>
                            </div>
                        ) : matchError ? (
                            <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                                <p className="text-red-700 font-bold">{matchError}</p>
                                <button onClick={handleLoadMatches} className="mt-4 text-sm font-black text-red-600 underline uppercase">Retry Scan</button>
                            </div>
                        ) : matches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {matches.slice(0, 6).map((property) => (
                                    <div
                                        key={property.id}
                                        className={`group relative bg-white rounded-2xl transition-all cursor-pointer overflow-hidden ${selectedPropertyIds.includes(property.id) ? 'border-2 border-orange-600 shadow-xl ring-4 ring-orange-50' : 'shadow-sm hover:shadow-md border border-slate-100'}`}
                                        onClick={() => togglePropertySelection(property.id)}
                                    >
                                        <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                            <img
                                                src={property.images?.[0] || '/placeholder-property.jpg'}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Action Overlay buttons */}
                                            <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleQuickAction(property.id, 'saved', e)}
                                                    disabled={savingStates[property.id]}
                                                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-green-600 rounded-lg shadow-sm"
                                                    title="Save to Matches"
                                                >
                                                    <BookmarkPlus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleQuickAction(property.id, 'dismissed', e)}
                                                    disabled={savingStates[property.id]}
                                                    className="p-1.5 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-red-600 rounded-lg shadow-sm"
                                                    title="Dismiss"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Selection Indicator */}
                                            <div className={`absolute inset-0 bg-orange-600/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 pointer-events-none ${selectedPropertyIds.includes(property.id) ? 'opacity-100' : 'opacity-0'}`}>
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl">
                                                    <CheckCircle className="w-8 h-8 text-orange-600" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${property.listing_type === 'For Sale' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                                    {property.listing_type}
                                                </span>
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[10px] font-black uppercase border border-slate-100">
                                                    {property.type}
                                                </span>
                                                <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-black uppercase border border-orange-100 flex items-center gap-1">
                                                    <Activity className="w-3 h-3" /> {property.match_score} pts
                                                </span>
                                            </div>
                                            <h5 className="font-black text-slate-800 text-sm truncate mb-1">{property.title}</h5>
                                            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
                                                <MapPin className="w-3 h-3" /> {property.location_city}
                                                {property.location_area && ` • ${property.location_area}`}
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                                <div className="text-lg font-black text-orange-600 leading-none">
                                                    {property.price.toLocaleString()} {property.currency}
                                                </div>
                                                <div className="flex gap-2">
                                                    {property.owner_id !== currentUserId && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleContactPartner(property);
                                                            }}
                                                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                                            title="Contact Partner"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/properties/${property.id}`}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                                        title="View Property"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 font-bold">No highly compatible properties found in current inventory.</p>
                                <p className="text-slate-400 text-xs mt-1">Try adjusting the lead preferences or scoring rules in Superadmin.</p>
                                <button onClick={handleLoadMatches} className="mt-4 text-xs font-black text-orange-600 underline uppercase">Scan Again</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedPartnerForContact && (
                <ContactPartnerModal
                    isOpen={isContactModalOpen}
                    onClose={() => {
                        setIsContactModalOpen(false);
                        setSelectedPartnerForContact(null);
                    }}
                    partnerId={selectedPartnerForContact.id}
                    partnerName={selectedPartnerForContact.full_name}
                    defaultMessage={modalDefaultMessage}
                    currentUserEmail={null}
                    currentUserId={currentUserId || null}
                />
            )}
        </div>
    );
}

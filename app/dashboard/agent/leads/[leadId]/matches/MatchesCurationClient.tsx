'use client';

import React, { useState, useEffect } from 'react';
import { LeadData } from '@/app/lib/types';
import { upsertMatchStatus } from '@/app/lib/actions/matches';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { Bookmark, Send, ThumbsUp, ThumbsDown, Calendar, AlertCircle, RefreshCw, Handshake, Share2, Eye, MapPin, XCircle, Zap, ArrowUpRight } from 'lucide-react';
import ShareMatchesModal from '@/app/components/dashboard/ShareMatchesModal';
import Link from 'next/link';

interface Props {
    lead: LeadData;
    initialMatches: any[];
}

export default function MatchesCurationClient({ lead, initialMatches }: Props) {
    const [matches, setMatches] = useState<any[]>(initialMatches);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [activeTab, setActiveTab] = useState<'curate' | 'saved' | 'sent' | 'interested' | 'not_interested' | 'visit_scheduled' | 'negotiation'>('curate');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);

    useEffect(() => {
        if (activeTab === 'curate' && aiSuggestions.length === 0 && !isLoadingAI) {
            loadAISuggestions();
        }
    }, [activeTab]);

    const loadAISuggestions = async () => {
        setIsLoadingAI(true);
        try {
            if (!lead.id) return;
            const results = await findMatchingProperties(lead.id);
            // Filter out properties that are already in initialMatches
            const existingIds = matches.map(m => m.property_id || m.property?.id);
            const newSuggestions = results.filter((p: any) => !existingIds.includes(p.id));
            setAiSuggestions(newSuggestions);
        } catch (error) {
            console.error('Failed to load AI suggestions:', error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleUpdateStatus = async (propertyId: string, status: string) => {
        if (!lead.id) return;
        setUpdatingIds(prev => [...prev, propertyId]);
        try {
            const res = await upsertMatchStatus(lead.id, propertyId, status);
            if (res.error) throw new Error(res.error);

            // Update local state
            setMatches(prev => {
                const existing = prev.find(m => (m.property_id || m.property?.id) === propertyId);
                if (existing) {
                    return prev.map(m => (m.property_id || m.property?.id) === propertyId ? { ...m, status } : m);
                } else {
                    // It was an AI suggestion, now it's a match
                    const prop = aiSuggestions.find(s => s.id === propertyId);
                    return [{ id: res.data?.id, property_id: propertyId, status, property: prop, created_at: new Date().toISOString() }, ...prev];
                }
            });

            // Remove from AI suggestions if it was there
            setAiSuggestions(prev => prev.filter(s => s.id !== propertyId));
        } catch (error) {
            console.error('Failed to update status', error);
            alert('Error updating status');
        } finally {
            setUpdatingIds(prev => prev.filter(id => id !== propertyId));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'saved': return <Bookmark className="w-4 h-4 text-orange-600" />;
            case 'sent': return <Send className="w-4 h-4 text-blue-600" />;
            case 'interested': return <ThumbsUp className="w-4 h-4 text-green-600" />;
            case 'not_interested': return <ThumbsDown className="w-4 h-4 text-red-600" />;
            case 'visit_scheduled': return <Calendar className="w-4 h-4 text-purple-600" />;
            case 'negotiation': return <Handshake className="w-4 h-4 text-amber-600" />;
            case 'dismissed': return <XCircle className="w-4 h-4 text-slate-400" />;
            default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'saved': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'sent': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'interested': return 'bg-green-50 text-green-700 border-green-200';
            case 'not_interested': return 'bg-red-50 text-red-700 border-red-200';
            case 'visit_scheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'negotiation': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'dismissed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const renderPropertyCard = (property: any, status?: string) => {
        const isUpdating = updatingIds.includes(property.id);
        
        return (
            <div key={property.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="aspect-video relative bg-slate-100">
                    <img src={property.images?.[0] || '/placeholder-property.jpg'} alt={property.title} className="w-full h-full object-cover" />
                    {status && (
                        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border shadow-sm ${getStatusColor(status)} backdrop-blur-sm bg-opacity-90`}>
                            {getStatusIcon(status)}
                            {status.replace('_', ' ')}
                        </div>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h4 className="font-black text-sm text-slate-900 line-clamp-2 mb-2 leading-tight">{property.title}</h4>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                        <MapPin className="w-3 h-3" /> {property.location_city} {property.location_area && `• ${property.location_area}`}
                    </div>
                    <div className="flex items-center justify-between mt-auto mb-4 border-t border-slate-100 pt-3">
                        <div className="text-lg font-black text-orange-600 leading-none">
                            {property.price?.toLocaleString()} {property.currency}
                        </div>
                        <Link
                            href={`/properties/${property.id}`}
                            target="_blank"
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                            title="View Full Details"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        {(!status || status === 'dismissed') && (
                            <>
                                <button onClick={() => handleUpdateStatus(property.id, 'saved')} className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <Bookmark className="w-3.5 h-3.5" /> Save
                                </button>
                                <button onClick={() => handleUpdateStatus(property.id, 'dismissed')} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <XCircle className="w-3.5 h-3.5" /> Dismiss
                                </button>
                            </>
                        )}
                        {status === 'saved' && (
                            <>
                                <button onClick={() => handleUpdateStatus(property.id, 'sent')} className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <Send className="w-3.5 h-3.5" /> Mark Sent
                                </button>
                                <button onClick={() => handleUpdateStatus(property.id, 'dismissed')} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <XCircle className="w-3.5 h-3.5" /> Dismiss
                                </button>
                            </>
                        )}
                        {(status === 'sent' || status === 'interested' || status === 'visit_scheduled' || status === 'negotiation') && (
                            <>
                                <button onClick={() => handleUpdateStatus(property.id, 'visit_scheduled')} className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <Calendar className="w-3.5 h-3.5" /> Visit
                                </button>
                                <button onClick={() => handleUpdateStatus(property.id, 'negotiation')} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                    <Handshake className="w-3.5 h-3.5" /> Negot.
                                </button>
                            </>
                        )}
                        {status === 'not_interested' && (
                            <button onClick={() => handleUpdateStatus(property.id, 'saved')} className="col-span-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <RefreshCw className="w-3.5 h-3.5" /> Re-Save
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const savedMatches = matches.filter(m => m.status === 'saved');
    const sentMatches = matches.filter(m => m.status === 'sent');
    const interestedMatches = matches.filter(m => m.status === 'interested');
    const notInterestedMatches = matches.filter(m => m.status === 'not_interested');
    const visitedMatches = matches.filter(m => m.status === 'visit_scheduled');
    const negotiationMatches = matches.filter(m => m.status === 'negotiation');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
                    <button onClick={() => setActiveTab('curate')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'curate' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        Curate AI ({aiSuggestions.length})
                    </button>
                    <button onClick={() => setActiveTab('saved')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'saved' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Saved ({savedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('sent')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'sent' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Sent ({sentMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('interested')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'interested' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Interested ({interestedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('not_interested')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'not_interested' ? 'bg-white shadow text-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Skipped ({notInterestedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('visit_scheduled')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'visit_scheduled' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Visit ({visitedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('negotiation')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'negotiation' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Negot. ({negotiationMatches.length})
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-slate-900/20 whitespace-nowrap"
                >
                    <Share2 className="w-4 h-4" /> Share With Lead
                </button>
            </div>

            <div className="mt-4">
                {activeTab === 'curate' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-500 fill-current" /> New AI Suggestions
                            </h2>
                            <button onClick={loadAISuggestions} disabled={isLoadingAI} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-lg border shadow-sm">
                                <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        {isLoadingAI ? (
                            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div></div>
                        ) : aiSuggestions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {aiSuggestions.map(prop => renderPropertyCard(prop))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No new AI suggestions to curate at the moment.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Bookmark className="w-5 h-5 text-orange-600" /> Saved Properties
                        </h2>
                        {savedMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {savedMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No saved properties. Curate some AI suggestions first!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'sent' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-600" /> Sent Properties
                        </h2>
                        {sentMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sentMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No properties marked as sent yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'interested' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ThumbsUp className="w-5 h-5 text-green-600" /> Interested
                        </h2>
                        {interestedMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {interestedMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No interested properties yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'not_interested' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <ThumbsDown className="w-5 h-5 text-slate-600" /> Skipped
                        </h2>
                        {notInterestedMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {notInterestedMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No skipped properties yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'visit_scheduled' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-purple-600" /> Visits
                        </h2>
                        {visitedMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {visitedMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No visits scheduled yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'negotiation' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Handshake className="w-5 h-5 text-amber-600" /> Negotiation
                        </h2>
                        {negotiationMatches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {negotiationMatches.map(m => renderPropertyCard(m.property, m.status))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-slate-500 font-bold">No properties in negotiation yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ShareMatchesModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                lead={lead}
            />
        </div>
    );
}

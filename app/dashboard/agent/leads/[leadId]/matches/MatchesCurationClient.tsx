'use client';

import React, { useState, useEffect } from 'react';
import { LeadData } from '@/app/lib/types';
import { upsertMatchStatus, bulkUpsertMatchStatus } from '@/app/lib/actions/matches';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { fetchPropertyByFriendlyId } from '@/app/lib/actions/properties';
import { Bookmark, Send, ThumbsUp, ThumbsDown, Calendar, AlertCircle, RefreshCw, Handshake, Share2, Eye, MapPin, XCircle, Zap, ArrowUpRight, CheckCircle, Clock, List, Activity, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import ShareMatchesModal from '@/app/components/dashboard/ShareMatchesModal';
import LeadProfileDetails from '@/app/components/dashboard/LeadProfileDetails';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/app/lib/utils/string';

interface Props {
    lead: LeadData;
    initialMatches: any[];
}

function MatchPropertyCard({ property, status, updatingIds, getStatusColor, getStatusIcon, handleUpdateStatus }: {
    property: any;
    status?: string;
    updatingIds: string[];
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    handleUpdateStatus: (id: string, status: string) => void;
}) {
    const [imageIndex, setImageIndex] = useState(0);
    const isUpdating = updatingIds.includes(property.id);
    const images: string[] = property.images && Array.isArray(property.images) && property.images.length > 0
        ? property.images
        : ['/placeholder-property.jpg'];

    const handlePrevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImageIndex((prev) => (prev + 1) % images.length);
    };

    const rawDesc = property.description || '';
    const cleanDesc = decodeHtmlEntities(rawDesc)
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();

    return (
        <div className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Fixed height image container with scrolling buttons */}
            <div className="h-48 w-full relative bg-slate-100 overflow-hidden shrink-0 group">
                <img src={images[imageIndex] || '/placeholder-property.jpg'} alt={property.title} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200" />
                
                {status && (
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border shadow-sm ${getStatusColor(status)} backdrop-blur-sm bg-opacity-90 z-10`}>
                        {getStatusIcon(status)}
                        {status.replace('_', ' ')}
                    </div>
                )}

                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all z-10 shadow-md"
                            title="Previous image"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition-all z-10 shadow-md"
                            title="Next image"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[10px] font-bold z-10 backdrop-blur-sm">
                            {imageIndex + 1} / {images.length}
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <h4 className="font-black text-sm text-slate-900 line-clamp-2 mb-2 leading-tight">{property.title}</h4>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                    <MapPin className="w-3 h-3" /> {property.location_city} {property.location_area && `• ${property.location_area}`}
                </div>

                {/* Property Specs (Rooms, Usable Area, Floor) */}
                <div className="grid grid-cols-3 gap-1 mb-3">
                    <div className="flex flex-col items-center justify-center py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Rooms</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1">{property.rooms || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Area</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1">{property.area_usable ? `${property.area_usable} m²` : '-'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center py-1.5 bg-slate-50/50 border border-slate-100 rounded-lg text-slate-700">
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">Floor</span>
                        <span className="text-xs font-extrabold text-slate-900 mt-1">
                            {property.floor !== null && property.floor !== undefined
                                ? ((property.total_floors !== null && property.total_floors !== undefined)
                                    ? `${property.floor}/${property.total_floors}`
                                    : `${property.floor}`)
                                : ((property.total_floors !== null && property.total_floors !== undefined)
                                    ? `-/ ${property.total_floors}`
                                    : '-')
                            }
                        </span>
                    </div>
                </div>

                {/* Fixed size scrollable section for description */}
                <div className="h-20 overflow-y-auto pr-1 mb-3 text-xs text-slate-600 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                    {cleanDesc ? (
                        <p className="whitespace-pre-line">{cleanDesc}</p>
                    ) : (
                        <p className="text-slate-400 italic">No description available.</p>
                    )}
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
                            <button onClick={() => handleUpdateStatus(property.id, 'interested')} className="px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <ThumbsUp className="w-3.5 h-3.5" /> Interested
                            </button>
                            <button onClick={() => handleUpdateStatus(property.id, 'dismissed')} className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Dismiss
                            </button>
                        </>
                    )}
                    {(status === 'sent' || status === 'interested') && (
                        <>
                            <button onClick={() => handleUpdateStatus(property.id, 'visit_scheduled')} className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <Calendar className="w-3.5 h-3.5" /> Schedule Visit
                            </button>
                            <button onClick={() => handleUpdateStatus(property.id, 'negotiation')} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <Handshake className="w-3.5 h-3.5" /> Negot.
                            </button>
                        </>
                    )}
                    {status === 'visit_scheduled' && (
                        <>
                            <button onClick={() => handleUpdateStatus(property.id, 'not_interested')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <ThumbsDown className="w-3.5 h-3.5" /> Skipped
                            </button>
                            <button onClick={() => handleUpdateStatus(property.id, 'negotiation')} className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <Handshake className="w-3.5 h-3.5" /> Negot.
                            </button>
                        </>
                    )}
                    {status === 'negotiation' && (
                        <>
                            <button onClick={() => handleUpdateStatus(property.id, 'not_interested')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <ThumbsDown className="w-3.5 h-3.5" /> Skipped
                            </button>
                            <button onClick={() => handleUpdateStatus(property.id, 'sold')} className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Sold
                            </button>
                        </>
                    )}
                    {status === 'not_interested' && (
                        <button onClick={() => handleUpdateStatus(property.id, 'saved')} className="col-span-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Re-Save
                        </button>
                    )}
                    {status === 'sold' && (
                        <button onClick={() => handleUpdateStatus(property.id, 'negotiation')} className="col-span-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Revert to Negotiation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MatchesCurationClient({ lead, initialMatches }: Props) {
    const [matches, setMatches] = useState<any[]>(initialMatches);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [activeTab, setActiveTab] = useState<'curate' | 'saved' | 'sent' | 'interested' | 'not_interested' | 'visit_scheduled' | 'negotiation'>('curate');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [manualAddId, setManualAddId] = useState('');
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [isAddingManual, setIsAddingManual] = useState(false);

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

    const handleAddManual = async () => {
        if (!manualAddId.trim()) return;
        setIsAddingManual(true);
        try {
            const res = await fetchPropertyByFriendlyId(manualAddId);
            if (res.error || !res.data) {
                alert(res.error || 'Property not found');
                return;
            }
            const prop = res.data;
            const existingIds = matches.map(m => m.property_id || m.property?.id);
            if (existingIds.includes(prop.id)) {
                alert('Property is already in one of the matches tabs.');
                return;
            }
            if (aiSuggestions.find(s => s.id === prop.id)) {
                alert('Property is already in AI suggestions.');
                return;
            }
            setAiSuggestions(prev => [prop, ...prev]);
            setManualAddId('');
        } catch (err) {
            console.error(err);
            alert('Failed to add property.');
        } finally {
            setIsAddingManual(false);
        }
    };

    const handleSaveAll = async () => {
        if (!lead.id || aiSuggestions.length === 0) return;
        if (!confirm(`Are you sure you want to save all ${aiSuggestions.length} suggestions?`)) return;

        setIsSavingAll(true);
        const propertyIds = aiSuggestions.map(s => s.id);
        try {
            const res = await bulkUpsertMatchStatus(lead.id, propertyIds, 'saved');
            if (res.error) throw new Error(res.error);

            // Update local matches state
            const newMatches = aiSuggestions.map((prop, idx) => ({
                id: res.data ? res.data[idx]?.id : `temp-${prop.id}`,
                property_id: prop.id,
                status: 'saved',
                property: prop,
                created_at: new Date().toISOString()
            }));

            setMatches(prev => [...newMatches, ...prev]);

            // Clear AI suggestions
            setAiSuggestions([]);
        } catch (error) {
            console.error('Failed to save all suggestions:', error);
            alert('Error saving all suggestions');
        } finally {
            setIsSavingAll(false);
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
            case 'sold': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
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
            case 'sold': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'dismissed': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const renderPropertyCard = (property: any, status?: string) => (
        <MatchPropertyCard
            key={property.id}
            property={property}
            status={status}
            updatingIds={updatingIds}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            handleUpdateStatus={handleUpdateStatus}
        />
    );

    const savedMatches = matches.filter(m => m.status === 'saved' || m.status === 'sent');
    const interestedMatches = matches.filter(m => m.status === 'interested');
    const notInterestedMatches = matches.filter(m => m.status === 'not_interested');
    const visitedMatches = matches.filter(m => m.status === 'visit_scheduled');
    const negotiationMatches = matches.filter(m => m.status === 'negotiation' || m.status === 'sold');

    return (
        <div className="flex flex-col gap-6">
            {/* Lead Profile Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-2">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20">
                            {(lead.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : 'N/A'}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span className="flex items-center gap-1"><List className="w-3 h-3" /> ID: {lead.id ? lead.id.slice(0, 8) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lead Score</div>
                            <div className="flex items-center gap-2">
                                <div className={`text-2xl font-black ${(lead.score || 0) >= 80 ? 'text-green-400' : (lead.score || 0) >= 50 ? 'text-orange-400' : 'text-slate-400'}`}>
                                    {lead.score || 0}
                                </div>
                                <Activity className={`w-6 h-6 ${(lead.score || 0) >= 80 ? 'text-green-400' : (lead.score || 0) >= 50 ? 'text-orange-400' : 'text-slate-400'}`} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <LeadProfileDetails lead={lead} />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg gap-1">
                    <button onClick={() => setActiveTab('curate')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'curate' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        Matched by AI ({aiSuggestions.length})
                    </button>
                    <button onClick={() => setActiveTab('saved')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'saved' ? 'bg-white shadow text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Saved ({savedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('interested')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'interested' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Interested ({interestedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('visit_scheduled')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'visit_scheduled' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Visit ({visitedMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('negotiation')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'negotiation' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Negot. ({negotiationMatches.length})
                    </button>
                    <button onClick={() => setActiveTab('not_interested')} className={`px-4 py-2 rounded-md text-sm font-black uppercase transition-all ${activeTab === 'not_interested' ? 'bg-white shadow text-slate-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Skipped ({notInterestedMatches.length})
                    </button>
                </div>
                
                <button 
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-normal flex items-center gap-2 transition-all shadow-md shadow-slate-900/20 whitespace-nowrap"
                >
                    <Share2 className="w-4 h-4" /> Manage & Share
                </button>
            </div>

            <div className="mt-4">
                {activeTab === 'curate' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-orange-500 fill-current" /> New AI Suggestions
                            </h2>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/10 rounded-lg p-1.5 w-full sm:w-64 transition-all">
                                    <input 
                                        type="text" 
                                        placeholder="Add by ID (e.g. P12345)"
                                        className="bg-transparent border-none focus:ring-0 text-sm px-2 w-full outline-none text-slate-900 font-semibold placeholder:text-slate-400"
                                        value={manualAddId}
                                        onChange={(e) => setManualAddId(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                                    />
                                    <button 
                                        onClick={handleAddManual}
                                        disabled={isAddingManual || !manualAddId.trim()}
                                        className="p-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md disabled:opacity-50 transition-colors"
                                    >
                                        {isAddingManual ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </div>
                                {aiSuggestions.length > 0 && (
                                    <button 
                                        onClick={handleSaveAll} 
                                        disabled={isSavingAll || isLoadingAI} 
                                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-orange-600/10 disabled:opacity-50 shrink-0"
                                    >
                                        {isSavingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" />}
                                        Save All ({aiSuggestions.length})
                                    </button>
                                )}
                                <button onClick={loadAISuggestions} disabled={isLoadingAI} className="p-2.5 text-slate-400 hover:text-slate-600 bg-white rounded-lg border shadow-sm transition-colors shrink-0">
                                    <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
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
            </div>

            <ShareMatchesModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                lead={lead}
            />
        </div>
    );
}

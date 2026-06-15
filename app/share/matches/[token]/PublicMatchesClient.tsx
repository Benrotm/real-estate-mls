'use client';

import React, { useState } from 'react';
import { updatePublicMatchStatus } from '@/app/lib/actions/matches';
import { Building2, ThumbsUp, ThumbsDown, CheckCircle, ArrowUpRight, MapPin, Clock, List, Activity } from 'lucide-react';
import Link from 'next/link';
import LeadProfileDetails from '@/app/components/dashboard/LeadProfileDetails';

interface Props {
    token: string;
    lead: any;
    initialMatches: any[];
}

export default function PublicMatchesClient({ token, lead, initialMatches }: Props) {
    const [matches, setMatches] = useState<any[]>(initialMatches);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);

    const handleUpdateStatus = async (matchId: string, status: 'interested' | 'not_interested') => {
        setUpdatingIds(prev => [...prev, matchId]);
        try {
            const res = await updatePublicMatchStatus(token, matchId, status);
            if (res.error) throw new Error(res.error);

            setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m));
        } catch (error) {
            console.error('Failed to update', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setUpdatingIds(prev => prev.filter(id => id !== matchId));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-600 rounded-xl">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-slate-900 tracking-tight">Property Matches</h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Curated for Lead ID: {lead.id.slice(0, 8)}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Top Profile Card Header - Premium Gradient */}
                <div className="mb-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20">
                                {(lead.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {new Date(lead.updated_at).toLocaleDateString()}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                    <span className="flex items-center gap-1"><List className="w-3 h-3" /> ID: {lead.id.slice(0, 8)}</span>
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

                <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
                    <h2 className="text-lg font-black text-slate-900 mb-2">Hello, Lead ID: {lead.id.slice(0, 8)}!</h2>
                    <p className="text-slate-600 font-medium text-sm">
                        I've hand-picked these properties based on our recent discussions. Please review them and let me know which ones catch your eye by clicking <strong>"I'm Interested"</strong> or <strong>"Pass"</strong>.
                    </p>
                </div>

                {matches.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 max-w-2xl mx-auto flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="w-8 h-8 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">No properties here right now</h3>
                        <p className="text-slate-500 font-bold max-w-sm">
                            Your agent hasn't marked any properties as "Sent" for your review yet. If your agent recently added properties, please ensure they click "Mark Sent" on their dashboard so they appear here!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map((match) => {
                            const property = match.property;
                            const isUpdating = updatingIds.includes(match.id);
                            const isInterested = match.status === 'interested';
                            const isNotInterested = match.status === 'not_interested';

                            return (
                                <div key={match.id} className={`bg-white rounded-2xl overflow-hidden transition-all shadow-sm border border-slate-200 flex flex-col ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="aspect-[4/3] bg-slate-100 relative">
                                        <img src={property.images?.[0] || '/placeholder-property.jpg'} alt={property.title} className="w-full h-full object-cover" />
                                        
                                        {/* Status Overlay */}
                                        {isInterested && (
                                            <div className="absolute inset-0 bg-green-600/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                                                <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-green-700 font-black tracking-widest uppercase">
                                                    <CheckCircle className="w-5 h-5" /> Interested
                                                </div>
                                            </div>
                                        )}
                                        {isNotInterested && (
                                            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                                                <div className="bg-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 text-slate-600 font-black tracking-widest uppercase">
                                                    <ThumbsDown className="w-5 h-5" /> Skipped
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">{property.type}</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">{property.listing_type}</span>
                                        </div>
                                        
                                        <h3 className="font-black text-slate-900 text-sm leading-tight mb-2 line-clamp-2">{property.title}</h3>
                                        
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                                            <MapPin className="w-3 h-3" /> {property.location_city} {property.location_area && `• ${property.location_area}`}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3 mb-4">
                                            <div className="text-lg font-black text-orange-600 leading-none">
                                                {property.price?.toLocaleString()} {property.currency}
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/properties/${property.id}`}
                                                    target="_blank"
                                                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-200"
                                                    title="View Full Details"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-3">
                                            {(!isInterested && !isNotInterested) ? (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(match.id, 'not_interested')}
                                                        className="py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        <ThumbsDown className="w-4 h-4" /> Pass
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(match.id, 'interested')}
                                                        className="py-2.5 bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all"
                                                    >
                                                        <ThumbsUp className="w-4 h-4" /> Interested
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdateStatus(match.id, isInterested ? 'not_interested' : 'interested')}
                                                    className="w-full py-2 bg-transparent text-slate-400 hover:text-slate-600 underline text-xs font-bold transition-colors"
                                                >
                                                    Change my mind (mark as {isInterested ? 'Pass' : 'Interested'})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

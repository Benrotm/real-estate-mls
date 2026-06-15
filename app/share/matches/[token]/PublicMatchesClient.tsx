'use client';

import React, { useState } from 'react';
import { updatePublicMatchStatus } from '@/app/lib/actions/matches';
import { Building2, ThumbsUp, ThumbsDown, CheckCircle, ArrowUpRight, MapPin } from 'lucide-react';
import Link from 'next/link';

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
        <div className="min-h-screen bg-slate-50 font-sans">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-600 rounded-xl">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-slate-900 tracking-tight">Property Matches</h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Curated for {lead.name}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center max-w-2xl mx-auto">
                    <h2 className="text-lg font-black text-slate-900 mb-2">Hello, {lead.name}!</h2>
                    <p className="text-slate-600 font-medium text-sm">
                        I've hand-picked these properties based on our recent discussions. Please review them and let me know which ones catch your eye by clicking <strong>"I'm Interested"</strong> or <strong>"Not Interested"</strong>.
                    </p>
                </div>

                {matches.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 max-w-2xl mx-auto">
                        <p className="text-slate-500 font-bold">No properties to review right now.</p>
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

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-wider">{property.type}</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">{property.listing_type}</span>
                                        </div>
                                        
                                        <h3 className="font-black text-slate-900 text-base leading-tight mb-2 line-clamp-2">{property.title}</h3>
                                        
                                        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">
                                            <MapPin className="w-3.5 h-3.5" /> {property.location_city} {property.location_area && `• ${property.location_area}`}
                                        </div>

                                        <div className="text-xl font-black text-orange-600 mb-6">
                                            {property.price?.toLocaleString()} {property.currency}
                                        </div>

                                        <div className="mt-auto flex flex-col gap-3">
                                            <Link 
                                                href={`/properties/${property.id}`} 
                                                target="_blank"
                                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors"
                                            >
                                                View Details <ArrowUpRight className="w-4 h-4" />
                                            </Link>

                                            {(!isInterested && !isNotInterested) ? (
                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
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
                                                        <ThumbsUp className="w-4 h-4" /> Interested!
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

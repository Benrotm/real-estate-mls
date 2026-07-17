'use client';

import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Zap, ListFilter } from 'lucide-react';
import Link from 'next/link';
import LeadForm from '../LeadForm';
import LeadActivityPanel from './LeadActivityPanel';
import MatchesCurationClient from './matches/MatchesCurationClient';
import { LeadData } from '@/app/lib/types';
import { STATUS_COLORS, STATUS_LABELS } from '@/app/components/dashboard/LeadList';
import LeadContactActions from './LeadContactActions';

interface Props {
    lead: LeadData;
    notes: any[];
    activities: any[];
    matches: any[];
    isReadOnly: boolean;
    currentUserId?: string;
}

export default function LeadDetailsClient({
    lead,
    notes,
    activities,
    matches,
    isReadOnly,
    currentUserId
}: Props) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(true);
    const [isCrmOpen, setIsCrmOpen] = useState(true);
    const [showCurationMatches, setShowCurationMatches] = useState(false);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/agent/leads" className="bg-white p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            {lead.name}
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] || lead.status}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Created by <span className="font-bold text-slate-700">{lead.creator?.full_name || 'System'}</span> on {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
                <LeadContactActions lead={lead} />
            </div>

            <div className="space-y-6">
                {/* Lead Details & Preferences Card (Collapsible) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div 
                        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                        className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <h2 className="font-bold text-slate-900 flex items-center gap-3">
                            Lead Details & Preferences
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-300">
                                ID: {lead.id ? lead.id.slice(0, 8) : 'N/A'}
                            </span>
                        </h2>
                        <div className="text-slate-400">
                            {isDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                    {isDetailsOpen && (
                        <div className="p-0">
                            <LeadForm initialData={lead} isEditing={true} readOnly={isReadOnly} />
                        </div>
                    )}
                </div>

                {/* CRM Panel - Notes & Activities (Collapsible, placed under edit form) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div 
                        onClick={() => setIsCrmOpen(!isCrmOpen)}
                        className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    >
                        <h2 className="font-bold text-slate-900 flex items-center gap-3">
                            CRM Panel (Notes & Activities)
                        </h2>
                        <div className="text-slate-400">
                            {isCrmOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                    {isCrmOpen && (
                        <div className="p-0">
                            <LeadActivityPanel
                                leadId={lead.id || ''}
                                lead={lead}
                                initialNotes={notes}
                                initialActivities={activities}
                            />
                        </div>
                    )}
                </div>

                {/* AI Matching Curation Section */}
                <div id="curation-matches-section">
                    {showCurationMatches ? (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-600/20">
                                        <Zap className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-950 tracking-tight">AI Matching Properties & Curation</h2>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select and curate suggestions for {lead.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowCurationMatches(false);
                                        setIsDetailsOpen(true);
                                        setIsCrmOpen(true);
                                    }}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm flex items-center gap-2 transition-all border border-slate-200 shadow-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Profile
                                </button>
                            </div>
                            
                            <MatchesCurationClient lead={lead} initialMatches={matches} hideProfileCard={true} />
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                                        <button
                                            onClick={() => {
                                                setShowCurationMatches(true);
                                                setIsDetailsOpen(false);
                                                setIsCrmOpen(false);
                                                setTimeout(() => {
                                                    document.getElementById('curation-matches-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }}
                                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-slate-900/20"
                                        >
                                            <ListFilter className="w-4 h-4" />
                                            Manage & Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

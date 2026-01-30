"use client";

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';

interface Lead {
    id: string;
    name: string;
    status: string;
    preference_type?: string;
    preference_location_city?: string;
    budget_max?: number;
    currency?: string;
    created_at: string;
}

interface PipelineBoardProps {
    initialLeads: Lead[];
}

const STAGES = [
    { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
    { id: 'contacted', title: 'Contacted', color: 'bg-yellow-500' },
    { id: 'viewing', title: 'Viewing', color: 'bg-purple-500' },
    { id: 'negotiation', title: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed', title: 'Closed', color: 'bg-green-500' },
    { id: 'lost', title: 'Lost', color: 'bg-slate-500' },
];

export default function PipelineBoard({ initialLeads }: PipelineBoardProps) {

    // Helper to format currency
    const formatPrice = (amount?: number, currency?: string) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'EUR',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(amount);
    };

    return (
        <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 min-w-max h-full pb-4">
                {STAGES.map(stage => {
                    const stageLeads = initialLeads.filter(l => l.status === stage.id);

                    return (
                        <div key={stage.id} className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-slate-200 h-full">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-xl sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                                    <h3 className="font-bold text-sm text-slate-800">{stage.title}</h3>
                                    <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                        {stageLeads.length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Cards Container */}
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[100px]">
                                {stageLeads.length > 0 ? (
                                    stageLeads.map(lead => (
                                        <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900 line-clamp-1">{lead.name}</h4>
                                                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                    {lead.budget_max ? formatPrice(lead.budget_max, lead.currency) : 'No Budget'}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 mb-3">
                                                Interested in: <span className="font-medium text-slate-700">{lead.preference_type || 'Any Property'}</span>
                                            </p>

                                            {lead.preference_location_city && (
                                                <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                                                    📍 {lead.preference_location_city}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-auto">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 text-xs flex items-center justify-center font-bold text-slate-500">
                                                    {lead.name.charAt(0)}
                                                </div>
                                                <Link
                                                    href={`/dashboard/agent/leads/${lead.id}`}
                                                    className="text-xs text-orange-600 font-bold hover:text-orange-700 hover:underline"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-40">
                                        <div className="text-xs font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-lg p-4">
                                            No leads in this stage
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

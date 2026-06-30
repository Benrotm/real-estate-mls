'use client';

import React from 'react';
import { Zap, ListFilter } from 'lucide-react';
import { LeadData } from '@/app/lib/types';
import { useRouter } from 'next/navigation';

interface Props {
    lead: LeadData;
    currentUserId?: string;
}

export default function LeadAIMatching({ lead, currentUserId }: Props) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-8">
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
                            onClick={() => router.push(`/dashboard/agent/leads/${lead.id}/matches`)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-md shadow-slate-900/20"
                        >
                            <ListFilter className="w-4 h-4" />
                            Manage & Share
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

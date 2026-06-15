import React from 'react';
import { createClient } from '@/app/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getLeadMatches } from '@/app/lib/actions/matches';
import MatchesCurationClient from './MatchesCurationClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function MatchesCurationPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        notFound();
    }

    const { matches } = await getLeadMatches(lead.id);

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href={`/dashboard/agent/leads/${lead.id}`} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lead Property Matches</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">ID: {lead.id.slice(0, 8)}</p>
                </div>
            </div>

            <MatchesCurationClient lead={lead} initialMatches={matches} />
        </div>
    );
}

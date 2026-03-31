import Link from 'next/link';
import { ArrowLeft, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { fetchLead, fetchNotes, fetchActivities } from '@/app/lib/actions/leads';
import { notFound } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import LeadForm from '../LeadForm';
import { revalidatePath } from 'next/cache';
import LeadActivityPanel from './LeadActivityPanel';
import LeadContactActions from './LeadContactActions';

export default async function LeadDetailsPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = await params;
    const lead = await fetchLead(leadId);
    const notes = (await fetchNotes(leadId)) || [];
    const activities = (await fetchActivities(leadId)) || [];

    if (!lead) {
        notFound();
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isReadOnly = true;
    if (user) {
        if (user.id === lead.agent_id) {
            isReadOnly = false;
        } else {
            const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (viewerProfile?.role === 'super_admin' || viewerProfile?.role === 'admin') {
                isReadOnly = false;
            } else {
                const { data: ownerProfile } = await supabase.from('profiles').select('agency_id').eq('id', lead.agent_id).single();
                if (ownerProfile?.agency_id === user.id) {
                    isReadOnly = false;
                }
            }
        }
    }

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
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border bg-slate-100 text-slate-600 border-slate-200 capitalize`}>
                                {lead.status}
                            </span>
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Created by <span className="font-bold text-slate-700">{lead.creator?.full_name || 'System'}</span> on {new Date(lead.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <LeadContactActions lead={lead} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Editable Details */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">Lead Details & Preferences</h2>
                        </div>
                        <div className="p-0">
                            {/* We reuse the LeadForm but perhaps with a "Save" button visible naturally */}
                            <LeadForm initialData={lead} isEditing={true} readOnly={isReadOnly} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Notes & Activity */}
                <div className="space-y-6">
                    <div className="space-y-6">
                        <LeadActivityPanel
                            leadId={leadId}
                            initialNotes={notes}
                            initialActivities={activities}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

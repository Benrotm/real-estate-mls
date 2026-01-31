import Link from 'next/link';
import { ArrowLeft, Phone, Mail, Clock } from 'lucide-react';
import { fetchLead, fetchNotes, fetchActivities, createNote } from '@/app/lib/actions/leads';
import { notFound } from 'next/navigation';
import LeadForm from '../LeadForm';
import { revalidatePath } from 'next/cache';
import LeadActivityPanel from './LeadActivityPanel';

export default async function LeadDetailsPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = await params;
    const lead = await fetchLead(leadId);
    const notes = (await fetchNotes(leadId)) || [];
    const activities = (await fetchActivities(leadId)) || [];

    if (!lead) {
        notFound();
    }

    // Force redeploy - verifying contact page route
    async function handleAddNote(formData: FormData) {
        "use server";
        const content = formData.get('content') as string;
        if (content && content.trim()) {
            await createNote(leadId, content);
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
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
                        <Phone className="w-4 h-4" /> Call
                    </button>
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50">
                        <Mail className="w-4 h-4" /> Email
                    </button>
                </div>
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
                            <LeadForm initialData={lead} isEditing={true} />
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
                            onAddNote={handleAddNote}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

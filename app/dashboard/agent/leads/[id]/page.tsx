import Link from 'next/link';
import { ArrowLeft, Clock, MessageSquare, Phone, Mail, Trash2, Edit } from 'lucide-react';
import { fetchLead, fetchNotes, createNote } from '@/app/lib/actions/leads';
import { notFound } from 'next/navigation';
import LeadForm from '../LeadForm';
import { revalidatePath } from 'next/cache';

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const lead = await fetchLead(id);
    const notes = await fetchNotes(id);

    if (!lead) {
        return (
            <div className="p-8 text-red-500">
                <h1 className="text-2xl font-bold">Debug: Lead Not Found</h1>
                <p>Lead ID from params: {id}</p>
                <p>Please report this to the developer.</p>
            </div>
        );
    }

    // Force redeploy - verifying contact page route
    async function handleAddNote(formData: FormData) {
        "use server";
        const content = formData.get('content') as string;
        if (content && content.trim()) {
            await createNote(id, content);
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
                        <p className="text-slate-500 text-sm">Created on {new Date(lead.created_at).toLocaleDateString()}</p>
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-bold text-slate-900">Activity & Notes</h2>
                        </div>

                        {/* Notes List - Scrollable */}
                        <div className="p-6 flex-1 max-h-[500px] overflow-y-auto space-y-6">
                            {notes.length > 0 ? (
                                notes.map((note: any) => (
                                    <div key={note.id} className="relative pl-6 border-l-2 border-slate-200 pb-1 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                        <div className="text-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-900 text-xs">{note.author?.full_name || 'Agent'}</span>
                                                <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                {note.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-sm">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    No notes yet. Start the conversation!
                                </div>
                            )}
                        </div>

                        {/* Add Note Input */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <form action={handleAddNote} className="relative">
                                <textarea
                                    name="content"
                                    required
                                    placeholder="Add a note about this client..."
                                    className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[80px]"
                                />
                                <button
                                    type="submit"
                                    className="absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm"
                                    title="Add Note"
                                >
                                    <Clock className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

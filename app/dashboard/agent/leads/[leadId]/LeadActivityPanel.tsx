'use client';

import { useState } from 'react';
import { Clock, MessageSquare, List } from 'lucide-react';

interface Activity {
    id: string;
    type: string;
    description: string;
    created_at: string;
    created_by?: string;
}

interface Note {
    id: string;
    content: string;
    created_at: string;
    author?: {
        full_name: string;
    };
}

interface Props {
    leadId: string;
    initialNotes: Note[];
    initialActivities: Activity[];
    onAddNote: (formData: FormData) => Promise<void>; // Server action passed as prop
}

export default function LeadActivityPanel({ leadId, initialNotes, initialActivities, onAddNote }: Props) {
    const [activeTab, setActiveTab] = useState<'notes' | 'activities'>('notes');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'notes'
                        ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                >
                    <MessageSquare className="w-4 h-4" />
                    Notes ({initialNotes.length})
                </button>
                <button
                    onClick={() => setActiveTab('activities')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'activities'
                        ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                >
                    <List className="w-4 h-4" />
                    Activities ({initialActivities.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 max-h-[500px] overflow-y-auto p-6 bg-slate-50/30">

                {/* NOTES TAB */}
                {activeTab === 'notes' && (
                    <div className="space-y-6">
                        {initialNotes.length > 0 ? (
                            initialNotes.map((note) => (
                                <div key={note.id} className="relative pl-6 border-l-2 border-slate-200 pb-1 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    <div className="text-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-slate-900 text-xs">{note.author?.full_name || 'Agent'}</span>
                                            <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
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
                )}

                {/* ACTIVITIES TAB */}
                {activeTab === 'activities' && (
                    <div className="space-y-4">
                        {initialActivities.length > 0 ? (
                            initialActivities.map((activity) => (
                                <div key={activity.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="mt-1 min-w-[32px] w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-slate-800">{activity.description}</p>
                                        <span className="text-xs text-slate-400">{new Date(activity.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                <List className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                No recorded activities.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area - Only for Notes */}
            {activeTab === 'notes' && (
                <div className="p-4 bg-white border-t border-slate-200 animate-in fade-in duration-300">
                    <form action={onAddNote} className="relative">
                        <textarea
                            name="content"
                            required
                            placeholder="Add a note about this client..."
                            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[80px]"
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
            )}
        </div>
    );
}

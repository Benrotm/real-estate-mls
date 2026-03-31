'use client';

import { useState, useRef } from 'react';
import { Clock, MessageSquare, List, Calendar, X } from 'lucide-react';
import { createNote, logLeadActivity } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';

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
    lead?: LeadData;
    initialNotes: Note[];
    initialActivities: Activity[];
}

export default function LeadActivityPanel({ leadId, lead, initialNotes, initialActivities }: Props) {
    const [activeTab, setActiveTab] = useState<'notes' | 'activities'>('notes');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Calendar Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [calendarEventType, setCalendarEventType] = useState<'Visit Scheduled' | 'To Recall'>('Visit Scheduled');
    const [eventDate, setEventDate] = useState('');
    const [propertyId, setPropertyId] = useState('');

    const TAG_STYLES: Record<string, string> = {
        'Calibration Call': 'bg-blue-100 text-blue-700 border-blue-200',
        'To Recall': 'bg-orange-100 text-orange-700 border-orange-200',
        'Not Responding': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Propose Properties': 'bg-purple-100 text-purple-700 border-purple-200',
        'Visit Scheduled': 'bg-teal-100 text-teal-700 border-teal-200',
        'Visit Made': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Not Interested': 'bg-slate-200 text-slate-700 border-slate-300',
        'Negotiations': 'bg-red-100 text-red-700 border-red-200',
        'Closed': 'bg-green-100 text-green-700 border-green-200',
        'Lost': 'bg-zinc-200 text-zinc-700 border-zinc-300',
        'WhatsApp': 'bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30',
        'Email': 'bg-sky-100 text-sky-700 border-sky-200'
    };

    const TAGS = Object.keys(TAG_STYLES).filter(tag => tag !== 'WhatsApp' && tag !== 'Email');

    const renderNoteContent = (content: string) => {
        const match = content.match(/^\[(.*?)\]\s*(.*)$/si); // Allow multi-line matches
        if (match) {
            const tag = match[1];
            if (TAG_STYLES[tag]) {
                return (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${TAG_STYLES[tag]} inline-block`}>
                            {tag}
                        </span>
                        <span className="mt-0.5 whitespace-pre-wrap">{match[2]}</span>
                    </div>
                );
            }
        }
        return <span className="whitespace-pre-wrap">{content}</span>;
    };

    async function handleOnSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const rawContent = formData.get('content') as string;
            if (rawContent && rawContent.trim()) {
                const finalContent = selectedTag ? `[${selectedTag}] ${rawContent}` : rawContent;
                await createNote(leadId, finalContent);
                
                // Log activity
                const activityDesc = selectedTag ? `Added note with tag: ${selectedTag}` : 'Added a note';
                await logLeadActivity(leadId, 'note', activityDesc);
            }
            formRef.current?.reset();
            setSelectedTag(null);
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleScheduleEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventDate) {
            alert("Please select a date and time");
            return;
        }

        const dateObj = new Date(eventDate);
        const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const startStr = formatGoogleDate(dateObj);
        const endStr = formatGoogleDate(endDateObj);

        const title = propertyId.trim() ? `${calendarEventType} - ${propertyId.trim()} - ${lead?.name || 'Client'}` : `${calendarEventType} - ${lead?.name || 'Client'}`;
        const description = `Phone: ${lead?.phone || 'N/A'}\nEmail: ${lead?.email || 'N/A'}`;
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}`;

        const noteContent = propertyId.trim() 
            ? `[${calendarEventType}] for property ${propertyId.trim()} at ${dateObj.toLocaleString()}`
            : `[${calendarEventType}] at ${dateObj.toLocaleString()}`;

        try {
            await createNote(leadId, noteContent);
            await logLeadActivity(leadId, 'meeting', `Scheduled: ${calendarEventType}`);
        } catch (error) {
            console.error('Failed to log scheduled event:', error);
        }

        setIsCalendarModalOpen(false);
        setEventDate('');
        setPropertyId('');
        window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    };

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
                                            {renderNoteContent(note.content)}
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
                    <div className="flex flex-wrap gap-2 mb-3">
                        {TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                    if (tag === 'Visit Scheduled' || tag === 'To Recall') {
                                        setCalendarEventType(tag as 'Visit Scheduled' | 'To Recall');
                                        setIsCalendarModalOpen(true);
                                    } else {
                                        setSelectedTag(selectedTag === tag ? null : tag);
                                    }
                                }}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all hover:brightness-95 ${TAG_STYLES[tag]} ${selectedTag === tag ? 'ring-2 ring-offset-1 ring-orange-500 shadow-sm' : 'opacity-80'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                    <form ref={formRef} onSubmit={handleOnSubmit} className="relative">
                        <textarea
                            name="content"
                            required
                            placeholder="Add a note about this client..."
                            className="w-full pl-4 pr-12 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-h-[80px]"
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`absolute bottom-3 right-3 p-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Add Note"
                        >
                            <Clock className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
                        </button>
                    </form>
                </div>
            )}

            {/* Calendar Modal */}
            {isCalendarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Add to Calendar
                            </div>
                            <button onClick={() => setIsCalendarModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleScheduleEvent} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Event Type</label>
                                <select 
                                    value={calendarEventType} 
                                    onChange={(e) => setCalendarEventType(e.target.value as any)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="Visit Scheduled">Visit Scheduled</option>
                                    <option value="To Recall">To Recall</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date & Time</label>
                                <input 
                                    type="datetime-local" 
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Property ID (Optional)</label>
                                <input 
                                    type="text" 
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    placeholder="e.g. P137"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                                    Schedule & Log Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

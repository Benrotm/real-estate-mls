'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, MessageSquare, List, Calendar, X, FileText, Printer, CheckCircle } from 'lucide-react';
import { createNote, logLeadActivity } from '@/app/lib/actions/leads';
import { getLeadPresentationContracts } from '@/app/lib/actions/presentation-contracts';
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
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'notes' | 'activities'>('notes');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Calendar Modal State
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [calendarEventType, setCalendarEventType] = useState<'Visit Scheduled' | 'To Recall'>('Visit Scheduled');
    const [eventDate, setEventDate] = useState('');
    
    // WhatsApp Modal State
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [propertyId, setPropertyId] = useState('');

    // Property Proposal Contract State
    const [contracts, setContracts] = useState<any[]>([]);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    const [contractPropId, setContractPropId] = useState('');
    const [contractLang, setContractLang] = useState<'ro' | 'en'>('ro');
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);

    useEffect(() => {
        async function fetchContracts() {
            try {
                const data = await getLeadPresentationContracts(leadId);
                setContracts(data || []);
            } catch (err) {
                console.error('Failed to fetch lead contracts:', err);
            }
        }
        fetchContracts();

        if (lead?.source) {
            const match = lead.source.match(/P\d+/i);
            if (match) {
                setContractPropId(match[0].toUpperCase());
            } else {
                const numMatch = lead.source.match(/\b\d{4,}\b/);
                if (numMatch) {
                    setContractPropId('P' + numMatch[0]);
                }
            }
        }
    }, [leadId, lead]);

    const TAG_STYLES: Record<string, string> = {
        'Calibration Call': 'bg-blue-100 text-blue-700 border-blue-200',
        'To Recall': 'bg-orange-100 text-orange-700 border-orange-200',
        'Not Responding': 'bg-indigo-100 text-indigo-700 border-indigo-200',
        'Propose Properties': 'bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30',
        'Visit Scheduled': 'bg-teal-100 text-teal-700 border-teal-200',
        'Visit Made': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Not Interested': 'bg-slate-200 text-slate-700 border-slate-300',
        'Negotiations': 'bg-red-100 text-red-700 border-red-200',
        'Closed': 'bg-green-100 text-green-700 border-green-200',
        'Lost': 'bg-zinc-200 text-zinc-700 border-zinc-300',
        'View Contract SEND': 'bg-amber-100 text-amber-700 border-amber-300',
        'View Contract Signed': 'bg-emerald-100 text-emerald-700 border-emerald-300',
        'Trimite Fișă Vizionare': 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200/70',
        'WhatsApp': 'bg-[#25D366]/20 text-[#128C7E] border-[#25D366]/30',
        'Email': 'bg-sky-100 text-sky-700 border-sky-200'
    };

    const TAGS = Object.keys(TAG_STYLES).filter(
        tag => tag !== 'WhatsApp' && 
               tag !== 'Email' && 
               tag !== 'View Contract SEND' && 
               tag !== 'View Contract Signed'
    );

    const formatNoteText = (text: string) => {
        if (!text) return '';
        
        // Match:
        // 1. Property link: [propId](url)
        // 2. seria [serial] nr. [number]
        // 3. [serial]/[number]
        const regex = /(\[([a-zA-Z0-9_-]+)\]\s*\(([^\)]+)\))|((seria\s+([a-zA-Z]+)\s+nr\.\s*([0-9]{8}-[0-9]{6}|[0-9]{6})))|((([a-zA-Z]+)\/([0-9]{8}-[0-9]{6}|[0-9]{6})))/gi;
        
        const parts = [];
        let lastIndex = 0;
        let match;
        
        // Reset regex index
        regex.lastIndex = 0;
        
        while ((match = regex.exec(text)) !== null) {
            // Add preceding text
            if (match.index > lastIndex) {
                parts.push(<span key={`txt-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
            }
            
            if (match[1]) {
                // Property link match
                const propId = match[2];
                const url = match[3];
                parts.push(
                    <a 
                        key={`link-${match.index}`} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-bold transition-colors inline-block tracking-wide mx-0.5 shadow-sm"
                    >
                        {propId.toUpperCase()}
                    </a>
                );
            } else {
                // Contract number match
                const fullMatchText = match[4] || match[8];
                const serial = match[6] || match[10];
                const contractNum = match[7] || match[11];
                
                const foundContract = (contracts || []).find(
                    c => c.contract_number === contractNum && 
                         c.contract_serial?.toUpperCase() === serial?.toUpperCase()
                );
                
                if (foundContract) {
                    const isSigned = foundContract.status === 'signed';
                    const themeStyles = isSigned
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300';
                    
                    parts.push(
                        <span key={`contract-${match.index}`} className="inline-flex items-center gap-1.5 flex-wrap">
                            <strong className="font-semibold">{fullMatchText}</strong>
                            <button
                                onClick={() => window.open(`/properties/presentation-contract-preview?id=${foundContract.id}`, '_blank')}
                                className={`inline-flex items-center gap-1.5 py-0.5 px-2 rounded text-[11px] font-bold transition-all ml-1.5 cursor-pointer align-middle select-none border shadow-sm ${themeStyles}`}
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Vizualizează/Printează Fișă
                            </button>
                        </span>
                    );
                } else {
                    parts.push(<strong key={`contract-raw-${match.index}`} className="font-semibold">{fullMatchText}</strong>);
                }
            }
            
            lastIndex = regex.lastIndex;
        }
        
        if (lastIndex < text.length) {
            parts.push(<span key={`txt-${lastIndex}`}>{text.substring(lastIndex)}</span>);
        }
        
        return parts.length > 0 ? parts : text;
    };

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
                        <span className="mt-0.5 whitespace-pre-wrap leading-relaxed">{formatNoteText(match[2])}</span>
                    </div>
                );
            }
        }
        return <span className="whitespace-pre-wrap leading-relaxed">{formatNoteText(content)}</span>;
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

    const handleProposePropertiesClick = () => {
        setPropertyId(''); // Clear previous input
        setIsWhatsAppModalOpen(true);
    };

    const submitWhatsAppPropose = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const propId = propertyId;
        
        let message = '';
        let url = '';
        if (lead?.phone) {
            // Strip non-digits
            let cleanPhone = lead.phone.replace(/\D/g, '');
            // Auto-format Romanian numbers starting with 0 (e.g., 07xx -> 407xx)
            if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
                cleanPhone = '40' + cleanPhone.substring(1);
            }
            url = `https://api.whatsapp.com/send/?phone=${cleanPhone}`;
        } else {
            alert("No phone number saved for this lead.");
            return;
        }
        
        if (propId && propId.trim() !== '') {
            const propertyLink = `${window.location.origin}/properties/${propId.trim()}`;
            message = `Shared Property [${propId.trim()}] (${propertyLink}) via WhatsApp`;
            url += `&text=${encodeURIComponent(`Check out this property: ${propertyLink}`)}`;
        } else {
            message = 'Opened WhatsApp chat to propose properties';
        }
        
        try {
            await logLeadActivity(leadId, 'contacted', message);
            await createNote(leadId, `[Propose Properties] ${message}`);
        } catch (error) {
            console.error('Failed to log Propose Properties activity:', error);
        }
        
        setIsWhatsAppModalOpen(false);
        setPropertyId('');
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCreateContractSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractPropId.trim()) {
            alert('Vă rugăm să introduceți ID-ul proprietății.');
            return;
        }

        setIsContractModalOpen(false);
        // Redirect to the new presentation contract generator with pre-filled property and lead IDs
        router.push(`/dashboard/agent/presentation-contracts/generate?property_id=${contractPropId.trim()}&lead_id=${leadId}`);
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
                        {/* Interactive Contracts List */}
                        {contracts.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 mb-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-4 h-4 text-orange-600" />
                                        Istoric Fișe de Vizionare ({contracts.length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsContractModalOpen(true)}
                                        className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider transition-colors flex items-center gap-1 hover:underline"
                                    >
                                        + Trimite Fișă Nouă
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                    {contracts.map((c) => {
                                        const isSigned = c.status === 'signed';
                                        return (
                                            <div 
                                                key={c.id} 
                                                className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors text-xs gap-3 group"
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-bold text-slate-800 truncate">
                                                        {c.property_details?.friendlyId || c.property_details?.id || 'Proprietate'} - {c.property_details?.title || 'Fără titlu'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                        Seria {c.contract_serial} nr. {c.contract_number} | {new Date(c.created_at).toLocaleDateString('ro-RO')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isSigned ? (
                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            Semnat
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            Trimis
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => window.open(`/properties/presentation-contract-preview?id=${c.id}`, '_blank')}
                                                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-300 bg-slate-50 group-hover:bg-white"
                                                        title="Vizualizează / Printează"
                                                    >
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
                                        <p className="text-sm text-slate-800">{formatNoteText(activity.description)}</p>
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
                                    } else if (tag === 'Propose Properties') {
                                        handleProposePropertiesClick();
                                    } else if (tag === 'Trimite Fișă Vizionare') {
                                        setIsContractModalOpen(true);
                                    } else {
                                        setSelectedTag(selectedTag === tag ? null : tag);
                                    }
                                }}
                                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all hover:brightness-95 ${TAG_STYLES[tag]} ${
                                    tag === 'Trimite Fișă Vizionare'
                                        ? 'ring-2 ring-amber-500 ring-offset-1 font-extrabold shadow-sm'
                                        : selectedTag === tag
                                        ? 'ring-2 ring-offset-1 ring-orange-500 shadow-sm'
                                        : 'opacity-80'
                                }`}
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

            {/* WhatsApp/Propose Properties Modal */}
            {isWhatsAppModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-2 text-slate-800 font-bold">
                                <MessageSquare className="w-5 h-5 text-[#25D366]" />
                                Propose Properties
                            </div>
                            <button onClick={() => setIsWhatsAppModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitWhatsAppPropose} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Property ID (Optional)</label>
                                <input 
                                    type="text" 
                                    value={propertyId}
                                    onChange={(e) => setPropertyId(e.target.value)}
                                    placeholder="e.g. P137"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Leave blank to just open WhatsApp and log the note.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Open WhatsApp
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Property Proposal Contract Modal */}
            {isContractModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Trimite Fișă de Vizionare
                            </div>
                            <button onClick={() => setIsContractModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateContractSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Referință Proprietate</label>
                                <input 
                                    type="text" 
                                    value={contractPropId}
                                    onChange={(e) => setContractPropId(e.target.value)}
                                    placeholder="e.g. P1971"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-slate-900"
                                    required
                                />
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Introduceți ID-ul proprietății sau referința. Se va genera o fișă de vizionare ce va fi trimisă clientului pe platformă.
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Limba Contractului (Language)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setContractLang('ro')}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                                            contractLang === 'ro' 
                                                ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-orange-200' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        Română (RO)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setContractLang('en')}
                                        className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                                            contractLang === 'en' 
                                                ? 'bg-orange-50 text-orange-700 border-orange-300 ring-2 ring-orange-200' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        English (EN)
                                    </button>
                                </div>
                            </div>
                            <div className="pt-3">
                                <button 
                                    type="submit" 
                                    disabled={isGeneratingContract}
                                    className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-700/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingContract ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" /> Se generează...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4" /> Generează și Trimite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}

'use client';

import React, { useState } from 'react';
import { Phone, Mail, MessageCircle, Calendar, X } from 'lucide-react';
import { logLeadActivity, createNote } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';

interface LeadContactActionsProps {
    lead: LeadData;
}

export default function LeadContactActions({ lead }: LeadContactActionsProps) {
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [eventType, setEventType] = useState<'Visit Scheduled' | 'To Recall'>('Visit Scheduled');
    const [eventDate, setEventDate] = useState('');
    const [propertyId, setPropertyId] = useState('');

    const handleWhatsAppClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        
        const propertyId = window.prompt("Enter Property ID (e.g. P137) if sharing a property, or leave blank to just open WhatsApp:");
        
        let message = '';
        let url = `https://wa.me/${lead.phone?.replace(/\D/g, '')}`;
        
        if (propertyId && propertyId.trim() !== '') {
            const propertyLink = `${window.location.origin}/properties/${propertyId.trim()}`;
            message = `Shared Property [${propertyId.trim()}] (${propertyLink}) via WhatsApp`;
            url += `?text=${encodeURIComponent(`Check out this property: ${propertyLink}`)}`;
        } else {
            message = 'Opened WhatsApp chat';
        }
        
        try {
            await logLeadActivity(lead.id!, 'contacted', message);
            await createNote(lead.id!, `[WhatsApp] ${message}`);
        } catch (error) {
            console.error('Failed to log WhatsApp activity:', error);
        }
        
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleCallClick = async () => {
        try {
            await logLeadActivity(lead.id!, 'contacted', 'Initiated a phone call');
            await createNote(lead.id!, '[Call] Initiated a phone call');
        } catch (error) {
            console.error('Failed to log Call activity:', error);
        }
    };

    const handleEmailClick = async () => {
        try {
            await logLeadActivity(lead.id!, 'contacted', 'Initiated an email');
            await createNote(lead.id!, '[Email] Initiated an email');
        } catch (error) {
            console.error('Failed to log Email activity:', error);
        }
    };

    const handleScheduleEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventDate) {
            alert("Please select a date and time");
            return;
        }

        const dateObj = new Date(eventDate);
        const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); // 1 hour duration
        
        // Format for Google Calendar (YYYYMMDDTHHMMSSZ, assuming local time needs to be converted to UTC string nicely)
        const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const startStr = formatGoogleDate(dateObj);
        const endStr = formatGoogleDate(endDateObj);

        const title = propertyId.trim() ? `${eventType} - ${propertyId.trim()} - ${lead.name || 'Client'}` : `${eventType} - ${lead.name || 'Client'}`;
        const description = `Phone: ${lead.phone || 'N/A'}\nEmail: ${lead.email || 'N/A'}`;
        
        const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(description)}`;

        // Log the note
        const noteContent = propertyId.trim() 
            ? `[${eventType}] for property ${propertyId.trim()} at ${dateObj.toLocaleString()}`
            : `[${eventType}] at ${dateObj.toLocaleString()}`;

        try {
            await createNote(lead.id!, noteContent);
            await logLeadActivity(lead.id!, 'meeting', `Scheduled: ${eventType}`);
        } catch (error) {
            console.error('Failed to log scheduled event:', error);
        }

        // Close modal and open calendar
        setIsCalendarModalOpen(false);
        setEventDate('');
        setPropertyId('');
        window.open(gcalUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="flex gap-2 relative">
            {lead.phone && (
                <a 
                    href={`tel:${lead.phone}`} 
                    onClick={handleCallClick}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
                >
                    <Phone className="w-4 h-4" /> Call
                </a>
            )}
            {lead.email && (
                <a 
                    href={`mailto:${lead.email}`} 
                    onClick={handleEmailClick}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50"
                >
                    <Mail className="w-4 h-4" /> Email
                </a>
            )}
            <button
                onClick={() => setIsCalendarModalOpen(true)}
                className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-colors shadow-sm"
            >
                <Calendar className="w-4 h-4" /> Calendar
            </button>
            {lead.phone && (
                <a 
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
                    onClick={handleWhatsAppClick}
                    className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#128C7E] transition-colors shadow-sm"
                >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
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
                                    value={eventType} 
                                    onChange={(e) => setEventType(e.target.value as any)}
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

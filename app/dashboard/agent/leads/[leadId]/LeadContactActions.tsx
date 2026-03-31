'use client';

import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';
import { logLeadActivity, createNote } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';

interface LeadContactActionsProps {
    lead: LeadData;
}

export default function LeadContactActions({ lead }: LeadContactActionsProps) {
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

    return (
        <div className="flex gap-2">
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
            {lead.phone && (
                <a 
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
                    onClick={handleWhatsAppClick}
                    className="px-4 py-2 bg-[#25D366] text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#128C7E] transition-colors shadow-sm"
                >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
            )}
        </div>
    );
}

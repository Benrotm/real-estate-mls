'use client';

import React from 'react';
import { X, Copy, Phone, Mail, Link as LinkIcon, Check } from 'lucide-react';
import { LeadData } from '@/app/lib/types';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lead: LeadData;
}

export default function ShareMatchesModal({ isOpen, onClose, lead }: Props) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareUrl = `${window.location.origin}/share/matches/${lead.public_share_token}`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShareWhatsApp = () => {
        const message = `Hello ${lead.name},\n\nI have curated a personalized list of properties for you based on your preferences. You can review them, and let me know which ones you are interested in directly via this secure link:\n\n${shareUrl}\n\nLooking forward to your feedback!`;
        const encoded = encodeURIComponent(message);
        const phone = lead.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    };

    const handleShareEmail = () => {
        const subject = encodeURIComponent('Your Personalized Property Matches');
        const body = encodeURIComponent(`Hello ${lead.name},\n\nI have curated a personalized list of properties for you based on your preferences.\n\nYou can review them, and click "I'm Interested" or "Not Interested" directly via this secure link:\n\n${shareUrl}\n\nLooking forward to your feedback!`);
        window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <LinkIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Share Matches</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">With {lead.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <p className="text-sm text-slate-600 font-medium">
                        Properties marked as <strong>"Sent"</strong> will be visible on this page. The lead can review the properties and explicitly click to indicate if they are interested or not. Their responses will instantly update on your dashboard.
                    </p>

                    <div>
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Secure Link</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 truncate font-mono select-all">
                                {shareUrl}
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleShareWhatsApp}
                            className="p-4 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 transition-colors flex flex-col items-center gap-2 group"
                        >
                            <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                <Phone className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-black text-sm">WhatsApp</span>
                        </button>
                        
                        <button 
                            onClick={handleShareEmail}
                            className="p-4 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors flex flex-col items-center gap-2 group"
                        >
                            <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                <Mail className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-black text-sm">Email</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

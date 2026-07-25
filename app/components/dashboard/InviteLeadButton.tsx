'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check, Share2, X, Send } from 'lucide-react';

interface Props {
    agentId: string;
}

export default function InviteLeadButton({ agentId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const inviteUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/invite/${agentId}?mode=crm_invite` 
        : '';

    const handleCopy = async () => {
        try {
            const textToCopy = `Spune-mi ce cauți și vei primi un link cu toate proprietățile care se potrivesc: ${inviteUrl}`;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link', err);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Imobum - Cerere Proprietate',
                    text: 'Spune-mi ce cauți și vei primi un link cu toate proprietățile care se potrivesc:',
                    url: inviteUrl,
                });
            } catch (err) {
                console.error('Error sharing link', err);
            }
        } else {
            // Fallback: Open WhatsApp directly
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Spune-mi ce cauți și vei primi un link cu toate proprietățile care se potrivesc: ' + inviteUrl)}`, '_blank');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 shrink-0"
            >
                <UserPlus className="w-4 h-4" /> Invite New Lead
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-base">Invite Client to CRM</h3>
                                    <p className="text-xs text-slate-400 font-medium">Share search preferences form</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4">
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                Share this personalized link with your client via WhatsApp, SMS, or Social Media.
                                Once they complete their search criteria, they will automatically appear as a new lead under your account with status <strong>New Lead</strong> and source <strong>Shared Link Form</strong>.
                            </p>

                            {/* Link Box */}
                            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                <input
                                    type="text"
                                    value={inviteUrl}
                                    readOnly
                                    className="flex-1 bg-transparent border-none text-slate-600 text-xs font-mono px-2 focus:ring-0 outline-none"
                                />
                                <button
                                    onClick={handleCopy}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${copied ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" /> Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Share Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleShare}
                                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                                >
                                    <Share2 className="w-4 h-4" /> Share Link
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

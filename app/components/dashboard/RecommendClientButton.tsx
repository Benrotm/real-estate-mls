'use client';

import React, { useState } from 'react';
import { UserPlus, Copy, Check, Share2, X, Send, Sparkles } from 'lucide-react';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

interface Props {
    userId: string;
}

export default function RecommendClientButton({ userId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const referralUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/signup?ref=${userId}&role=client_no_agency`
        : '';

    const shareMessage = `Intră pe Imobum.com și caută-ți singur proprietatea potrivită direct de la proprietar folosind AI Matching! Înregistrează-te gratuit aici: ${referralUrl}`;

    const handleCopy = async () => {
        if (!referralUrl) return;
        const success = await copyToClipboardSafe(referralUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            try {
                await navigator.share({
                    title: 'Imobum - Recomandare Client Nou',
                    text: 'Intră pe Imobum.com și găsește-ți singur proprietatea potrivită de la proprietar:',
                    url: referralUrl,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
                }
            }
        } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-95"
            >
                <Sparkles className="w-4 h-4 fill-current text-yellow-300" />
                Recomandă Unui Client Nou
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                                    <Sparkles className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-white">Recomandă Unui Client Nou</h3>
                                    <p className="text-[11px] text-slate-300 font-medium">Link de invitație referral direct</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-4 text-xs">
                            <p className="text-slate-600 font-medium leading-relaxed bg-orange-50/70 p-3 rounded-xl border border-orange-200/80 text-orange-950">
                                Trimite acest link unui client nou care dorește să caute singur proprietăți fără agent.
                                La înregistrare, va fi asociat contului tău ca referral și vei primi un comision din credite conform setărilor din platformă!
                            </p>

                            {/* Link Box */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-slate-400">Link-ul Tău de Invitație Client</label>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                    <input
                                        type="text"
                                        value={referralUrl}
                                        readOnly
                                        className="flex-1 bg-transparent border-none text-slate-800 text-xs font-mono px-2 focus:ring-0 outline-none select-all"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-3.5 h-3.5" /> Copiat
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3.5 h-3.5" /> Copiază
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Share Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleShare}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                                >
                                    <Share2 className="w-4 h-4" /> Trimite pe WhatsApp / Social
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center justify-center transition-all"
                                >
                                    Închide
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

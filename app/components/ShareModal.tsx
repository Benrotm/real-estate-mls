'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Share2 } from 'lucide-react';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    title?: string;
    customText?: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    shareUrl,
    title = 'Trimite Invitația',
    customText = 'Bună! Te invit pe Imobum, platforma imobiliară inteligentă. Înregistrează-te folosind link-ul meu și primești credite cadou pentru a testa instrumentele AI:'
}: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'share' in navigator) {
            setCanShare(true);
        }
    }, []);

    if (!isOpen) return null;

    const copyLink = async () => {
        const success = await copyToClipboardSafe(shareUrl);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareMessage = `${customText}\n\n${shareUrl}`;

    // Share handlers
    const shareWhatsApp = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
    };

    const shareFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    };

    const shareTelegram = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(customText)}`, '_blank');
    };

    const shareEmail = () => {
        window.open(`mailto:?subject=${encodeURIComponent('Invitație Imobum')}&body=${encodeURIComponent(shareMessage)}`, '_self');
    };

    const handleNativeShare = async () => {
        try {
            await navigator.share({
                title: 'Invitație Imobum',
                text: customText,
                url: shareUrl,
            });
        } catch (error) {
            console.error('Eroare la share nativ:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 text-white">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">{title}</h3>
                            <p className="text-xs text-slate-400 font-medium">Alege cum vrei să trimiți link-ul</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-850 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Share Options Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* WhatsApp */}
                        <button
                            onClick={shareWhatsApp}
                            className="flex items-center gap-3 p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all font-semibold text-sm text-emerald-400 justify-start"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                        </button>

                        {/* Facebook */}
                        <button
                            onClick={shareFacebook}
                            className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all font-semibold text-sm text-blue-400 justify-start"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                        </button>

                        {/* Telegram */}
                        <button
                            onClick={shareTelegram}
                            className="flex items-center gap-3 p-3 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 hover:border-sky-500/40 rounded-xl transition-all font-semibold text-sm text-sky-400 justify-start"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                            </svg>
                            Telegram
                        </button>

                        {/* Email */}
                        <button
                            onClick={shareEmail}
                            className="flex items-center gap-3 p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-650 rounded-xl transition-all font-semibold text-sm text-slate-300 hover:text-white justify-start"
                        >
                            <Mail className="w-5 h-5 text-slate-400" />
                            Email
                        </button>
                    </div>

                    {canShare && (
                        <div className="pt-2 border-t border-slate-800">
                            <button
                                onClick={handleNativeShare}
                                className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-orange-500/15 to-emerald-500/15 hover:from-orange-500/25 hover:to-emerald-500/25 border border-slate-800 rounded-xl transition-all font-bold text-sm text-slate-200"
                            >
                                <Share2 className="w-4 h-4 text-orange-400 animate-pulse" />
                                Alte opțiuni de share (Nativ)
                            </button>
                        </div>
                    )}

                    {/* Copy field */}
                    <div className="space-y-2 pt-4 border-t border-slate-800">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Sau copiază link-ul direct</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 outline-none select-all"
                            />
                            <button
                                onClick={copyLink}
                                className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs shrink-0"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                                {copied ? 'Copiat!' : 'Copiază'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer banner */}
                <div className="p-4 bg-slate-950/40 border-t border-slate-800 text-center text-[11px] text-slate-500 italic">
                    Creditele se acordă automat după înregistrarea contului nou.
                </div>
            </div>
        </div>
    );
}

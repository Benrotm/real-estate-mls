'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Share2, X, Send, Sparkles, Edit3, Save, FileText } from 'lucide-react';
import { copyToClipboardSafe } from '@/app/lib/utils/clipboard';

interface Props {
    userId: string;
}

const SUPERADMIN_DEFAULT_TEXT = "Intră pe Imobum.com și caută-ți singur proprietatea potrivită direct de la proprietar folosind AI Matching! Înregistrează-te gratuit pe platformă:";

export default function RecommendClientButton({ userId }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // 3 variants state
    const [selectedVariant, setSelectedVariant] = useState<'superadmin' | 'custom1' | 'custom2'>('superadmin');
    const [superadminText, setSuperadminText] = useState(SUPERADMIN_DEFAULT_TEXT);
    const [customText1, setCustomText1] = useState('');
    const [customText2, setCustomText2] = useState('');
    const [activeMessageText, setActiveMessageText] = useState(SUPERADMIN_DEFAULT_TEXT);
    const [isSavedNotice, setIsSavedNotice] = useState(false);

    const referralUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/signup?ref=${userId}&role=client_no_agency`
        : '';

    // Load custom text variants from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved1 = localStorage.getItem(`referral_text_custom1_${userId}`) || "Salut! Am găsit o metodă excelentă de a căuta proprietăți imobiliare direct de la proprietar prin AI. Vezi detalii și înregistrează-te gratuit aici:";
            const saved2 = localStorage.getItem(`referral_text_custom2_${userId}`) || "Cauți un apartament sau o casă fără intermediari? Folosește noul modul de AI Matching pe Imobum pentru acces direct la proprietari:";
            setCustomText1(saved1);
            setCustomText2(saved2);
            setActiveMessageText(SUPERADMIN_DEFAULT_TEXT);
        }
    }, [userId]);

    // Handle variant tab change
    const handleVariantChange = (variant: 'superadmin' | 'custom1' | 'custom2') => {
        setSelectedVariant(variant);
        if (variant === 'superadmin') setActiveMessageText(superadminText);
        else if (variant === 'custom1') setActiveMessageText(customText1);
        else if (variant === 'custom2') setActiveMessageText(customText2);
    };

    // Update active text and update underlying custom text
    const handleTextChange = (val: string) => {
        setActiveMessageText(val);
        if (selectedVariant === 'custom1') setCustomText1(val);
        else if (selectedVariant === 'custom2') setCustomText2(val);
        else if (selectedVariant === 'superadmin') setSuperadminText(val);
    };

    const handleSaveCustomVariants = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(`referral_text_custom1_${userId}`, customText1);
            localStorage.setItem(`referral_text_custom2_${userId}`, customText2);
            setIsSavedNotice(true);
            setTimeout(() => setIsSavedNotice(false), 2000);
        }
    };

    const fullShareContent = `${activeMessageText.trim()}\n\n👉 Înregistrează-te gratuit aici:\n${referralUrl}`;

    const handleCopy = async () => {
        if (!referralUrl) return;
        const success = await copyToClipboardSafe(fullShareContent);
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
                    text: activeMessageText.trim(),
                    url: referralUrl,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareContent)}`, '_blank');
                }
            }
        } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareContent)}`, '_blank');
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                                    <Sparkles className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-white">Recomandă Unui Client Nou</h3>
                                    <p className="text-[11px] text-slate-300 font-medium">Marketing & Link de invitație referral direct</p>
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
                                Alege sau editează textul de marketing alăturat link-ului de înregistrare. Clienții invitați vor fi conectați contului tău și vei primi comision din credite!
                            </p>

                            {/* Marketing Text Variant Tabs */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-black uppercase text-slate-500">Variante Text Marketing</label>
                                    {selectedVariant !== 'superadmin' && (
                                        <button
                                            onClick={handleSaveCustomVariants}
                                            className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                                        >
                                            {isSavedNotice ? <Check className="w-3 h-3 text-emerald-600" /> : <Save className="w-3 h-3 text-emerald-600" />}
                                            {isSavedNotice ? 'Salvat!' : 'Salvează Variantele Tale'}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => handleVariantChange('superadmin')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                                            selectedVariant === 'superadmin'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Sparkles className="w-3 h-3 text-amber-400" /> Preset Superadmin
                                    </button>
                                    <button
                                        onClick={() => handleVariantChange('custom1')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                                            selectedVariant === 'custom1'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Edit3 className="w-3 h-3 text-orange-400" /> Varianta Mea 1
                                    </button>
                                    <button
                                        onClick={() => handleVariantChange('custom2')}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center gap-1 ${
                                            selectedVariant === 'custom2'
                                                ? 'bg-slate-900 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <FileText className="w-3 h-3 text-indigo-400" /> Varianta Mea 2
                                    </button>
                                </div>

                                {/* Editable Textarea */}
                                <textarea
                                    rows={3}
                                    value={activeMessageText}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    placeholder="Scrie textul de prezentare pentru marketing..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 leading-relaxed resize-none"
                                />
                            </div>

                            {/* Referral Link Preview Box */}
                            <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-slate-400">Link Referral Atașat</label>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                    <input
                                        type="text"
                                        value={referralUrl}
                                        readOnly
                                        className="flex-1 bg-transparent border-none text-slate-700 text-xs font-mono px-2 focus:ring-0 outline-none select-all"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleCopy}
                                    className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm ${
                                        copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copiat Text + Link!' : 'Copiază Text + Link'}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                                >
                                    <Share2 className="w-4 h-4" /> Trimite pe WhatsApp / Social
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

'use client';

import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
    description?: string;
}

export default function UpgradeModal({ isOpen, onClose, featureName, description }: UpgradeModalProps) {
    // We can add logic here to check current user role/plan explicitly if needed, 
    // but usually this modal uses pre-determined "locked" state passed from parent.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5 text-slate-500" />
                </button>

                {/* Header Image / Icon */}
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-20"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Unlock {featureName}</h2>
                        <p className="text-indigo-100 text-sm">
                            {description || "This is a premium feature available on higher tier plans."}
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-slate-600 text-sm">Access advanced tools and analytics</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-slate-600 text-sm">Stand out with premium listing features</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-slate-600 text-sm">Priority support and dedicated account manager</p>
                        </div>
                    </div>

                    <Link
                        href="/pricing"
                        onClick={onClose}
                        className="block w-full bg-slate-900 text-white font-bold py-4 rounded-xl text-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Upgrade Plan
                    </Link>

                    <button
                        onClick={onClose}
                        className="block w-full text-slate-500 text-sm font-semibold mt-4 hover:text-slate-700"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}

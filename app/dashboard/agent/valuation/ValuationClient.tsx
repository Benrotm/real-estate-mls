'use client';

import React, { useState, useEffect } from 'react';
import ValuationWidget from '@/app/components/ValuationWidget';
import { Property } from '@/app/lib/properties';
import { Search, Plus, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ValuationClientProps {
    properties: Property[];
}

type Step = 'SELECT' | 'PROCESSING' | 'RESULT';

export default function ValuationClient({ properties }: ValuationClientProps) {
    const [step, setStep] = useState<Step>('SELECT');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
    const [processingStage, setProcessingStage] = useState(0);

    const selectedProperty = properties.find(p => p.id === selectedPropertyId);

    const handleStartValuation = () => {
        if (!selectedPropertyId) return;
        setStep('PROCESSING');
    };

    // Simulated processing sequence
    useEffect(() => {
        if (step === 'PROCESSING') {
            const stages = [
                () => setProcessingStage(1), // Analyzing Data
                () => setProcessingStage(2), // Fetching Environmental
                () => setProcessingStage(3), // Finding Comparables
                () => setStep('RESULT')      // Done
            ];

            let i = 0;
            const interval = setInterval(() => {
                if (i < stages.length) {
                    stages[i]();
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 1500);

            return () => clearInterval(interval);
        }
    }, [step]);

    return (
        <div className="max-w-7xl mx-auto min-h-[600px]">

            {/* Header / Hero */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    Smart Valuation Engine
                </h1>
                <p className="text-lg text-slate-500 mt-3 max-w-2xl mx-auto">
                    AI-powered property estimation combining real-time market data, environmental factors, and lifestyle metrics.
                </p>
            </div>

            {/* STEP 1: SELECTION */}
            {step === 'SELECT' && (
                <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Select Property to Evaluate</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <select
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none"
                                    value={selectedPropertyId}
                                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                                >
                                    <option value="" disabled>Search or select a property...</option>
                                    {properties.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Or</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <Link
                            href="/dashboard/owner/add-property"
                            className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-500 hover:text-orange-500 transition-colors font-medium group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Add New Property
                        </Link>

                        <button
                            onClick={handleStartValuation}
                            disabled={!selectedPropertyId}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${selectedPropertyId
                                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/25'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Run Analysis <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: PROCESSING */}
            {step === 'PROCESSING' && (
                <div className="max-w-md mx-auto text-center py-12 animate-in fade-in duration-500">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-orange-500 border-r-orange-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-700">{processingStage * 25}%</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className={`transition-all duration-500 ${processingStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center justify-center gap-2 text-slate-600">
                                {processingStage > 1 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                <span className="font-medium">Analyzing Property Specs...</span>
                            </div>
                        </div>
                        <div className={`transition-all duration-500 delay-100 ${processingStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center justify-center gap-2 text-slate-600">
                                {processingStage > 2 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                <span className="font-medium">Fetching Air Quality & Solar Data...</span>
                            </div>
                        </div>
                        <div className={`transition-all duration-500 delay-200 ${processingStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                            <div className="flex items-center justify-center gap-2 text-slate-600">
                                {processingStage > 3 ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                                <span className="font-medium">Comparing Recent Sales...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: RESULTS */}
            {step === 'RESULT' && selectedProperty && (
                <div className="animate-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold">Valuation Report</h2>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">Live</span>
                        </div>
                        <button
                            onClick={() => { setStep('SELECT'); setProcessingStage(0); }}
                            className="text-sm text-slate-500 hover:text-slate-800 underline"
                        >
                            Start New Valuation
                        </button>
                    </div>

                    <ValuationWidget property={selectedProperty} />

                    <div className="mt-8 text-center">
                        <p className="text-slate-400 text-sm">
                            Value computed based on {selectedProperty.area_usable} m² in {selectedProperty.location_city}.
                            <br />Includes adjustments for AQI, Solar Potential, and Market Trends.
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}

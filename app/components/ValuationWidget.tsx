'use client';

import { useState, useEffect } from 'react';
import { Property } from '@/app/lib/properties'; // Assuming this exists or I should check. Use 'any' if unsure.
import { getSmartValuation } from '@/app/lib/actions/valuation';
import { Lock, TrendingUp, Info, CheckCircle, BarChart3, Star, Home, ArrowUpRight, Sofa, Building, Layers, Search, Wind, Sun } from 'lucide-react';
import Link from 'next/link';


interface ValuationWidgetProps {
    property: any; // Using any to avoid strict type issues if Property definition mismatches
}

export default function ValuationWidget({ property }: ValuationWidgetProps) {
    const [valuation, setValuation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<'free' | 'paid'>('free'); // Can fetch real plan later based on requirements

    useEffect(() => {
        async function loadValuation() {
            if (!property?.id) return;
            try {
                const result = await getSmartValuation(property.id);
                setValuation(result);
            } catch (e) {
                console.error("Failed to load valuation", e);
            } finally {
                setLoading(false);
            }
        }

        loadValuation();

        // Optional: Check user plan
        // setUserPlan('paid'); 
    }, [property]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Smart Valuation...</div>;
    if (!valuation) return null; // No valuation available

    const currencySymbol = property.currency === 'USD' ? '$' : '€';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: property.currency || 'EUR',
            maximumFractionDigits: 0
        }).format(price);
    };

    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-emerald-500';
        if (aqi <= 100) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden my-8 scroll-mt-24" id="valuation">
            {/* Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Smart Valuation Engine</h3>
                        <p className="text-sm text-gray-300">Lifestyle-Adjusted Market Estimate</p>
                    </div>
                </div>

                {/* Demo Control */}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                    <span className="text-gray-400 uppercase tracking-widest font-semibold">View As:</span>
                    <button onClick={() => setUserPlan('free')} className={`px-2 py-0.5 rounded ${userPlan === 'free' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Guest</button>
                    <button onClick={() => setUserPlan('paid')} className={`px-2 py-0.5 rounded ${userPlan === 'paid' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Pro</button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-0 relative">

                {/* Blur Overlay for Free Users */}
                {userPlan === 'free' && (
                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Lock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-2xl font-bold text-slate-900 mb-2">Unlock Smart Valuation</h4>
                        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                            See how Air Quality, Solar Potential, and Comp Sales affect this property's true value.
                        </p>
                        <button onClick={() => setUserPlan('paid')} className="bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20">
                            Unlock Full Report
                        </button>
                    </div>
                )}

                {/* Main Data */}
                <div className={userPlan === 'free' ? 'filter blur-sm select-none opacity-50 p-6' : 'p-6'}>

                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center">
                            <p className="text-sm text-indigo-900 font-bold uppercase tracking-wider mb-1">Estimated Value</p>
                            <p className="text-4xl font-extrabold text-slate-900">{formatPrice(valuation.estimatedValue)}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className={`h-2 w-2 rounded-full ${valuation.confidenceScore > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                                <span className="text-xs font-bold text-slate-500">{valuation.confidenceScore > 80 ? 'High Confidence' : 'Moderate Confidence'}</span>
                            </div>
                        </div>

                        {/* Lifestyle Factors Summary */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-2 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full bg-emerald-50 border border-emerald-100`}>
                                    <Wind className={`w-6 h-6 ${getAqiColor(valuation.lifestyleFactors.aqi.value)}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Air Quality</p>
                                    <p className="text-lg font-bold text-slate-800">{valuation.lifestyleFactors.aqi.category}</p>
                                    <p className="text-xs text-slate-400">AQI: {valuation.lifestyleFactors.aqi.value}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-orange-50 border border-orange-100">
                                    <Sun className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Solar Potential</p>
                                    <p className="text-lg font-bold text-slate-800">{valuation.lifestyleFactors.solar.score}/100</p>
                                    <p className="text-xs text-slate-400">{Math.round(valuation.lifestyleFactors.solar.kwh)} kWh/yr</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Breakdown */}
                        <div className="lg:col-span-2 space-y-6">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                Value Logic
                            </h4>

                            <div className="space-y-3">
                                {/* Base */}
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-slate-600">Base Market Value (based on size)</span>
                                    <span className="font-bold text-slate-700">{formatPrice(valuation.baseValue)}</span>
                                </div>

                                {/* AQI Impact */}
                                <div className="flex justify-between items-center p-3 bg-emerald-50/30 rounded-lg border border-emerald-100/50">
                                    <span className="text-slate-700 flex items-center gap-2">
                                        <Wind className="w-4 h-4 text-emerald-500" />
                                        Air Quality Adjustment
                                    </span>
                                    <span className={`font-bold ${valuation.lifestyleFactors.aqi.impact >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {valuation.lifestyleFactors.aqi.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.aqi.impact * 100).toFixed(1)}%
                                    </span>
                                </div>

                                {/* Solar Impact */}
                                <div className="flex justify-between items-center p-3 bg-orange-50/30 rounded-lg border border-orange-100/50">
                                    <span className="text-slate-700 flex items-center gap-2">
                                        <Sun className="w-4 h-4 text-orange-500" />
                                        Solar Potential Bonus
                                    </span>
                                    <span className="font-bold text-orange-600">
                                        {valuation.lifestyleFactors.solar.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.solar.impact * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Comps List */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Home className="w-5 h-5 text-indigo-500" />
                                Recent Sales (Comps)
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {valuation.comparables.map((comp: any) => (
                                    <div key={comp.id} className="flex flex-col p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-slate-700">{formatPrice(Number(comp.sold_price))}</span>
                                            <span className="text-slate-400 text-xs">{new Date(comp.sold_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-slate-600 text-xs truncate">
                                            {comp.properties?.address || 'Address hidden'}
                                        </div>
                                        <div className="mt-1 flex gap-2 text-xs text-slate-400">
                                            <span>{comp.properties?.rooms} Beds</span>
                                            <span>•</span>
                                            <span>{comp.properties?.area_usable} m²</span>
                                        </div>
                                    </div>
                                ))}
                                {valuation.comparables.length === 0 && (
                                    <p className="text-sm text-slate-400 italic">No direct comparables found nearby.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { Property } from '../lib/properties';
import { calculateValuation, ValuationResult } from '../lib/valuation';
import { Lock, TrendingUp, Info, CheckCircle, BarChart3, Star, Home, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface ValuationWidgetProps {
    property: Property;
}

export default function ValuationWidget({ property }: ValuationWidgetProps) {
    const [valuation, setValuation] = useState<ValuationResult | null>(null);
    const [userPlan, setUserPlan] = useState<'free' | 'paid'>('free'); // Simulating user state

    // Simulate loading valuation data
    useEffect(() => {
        const result = calculateValuation(property);
        setValuation(result);
    }, [property]);

    if (!valuation) return <div className="p-8 text-center text-gray-500">Loading valuation...</div>;

    const currencySymbol = property.currency === 'EUR' ? '€' : '$';

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: property.currency,
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden my-8 scroll-mt-24" id="valuation">
            {/* Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Property Valuation</h3>
                        <p className="text-sm text-gray-300">AI-Powered Market Estimate</p>
                    </div>
                </div>

                {/* Demo Control - For Presentation Only */}
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                    <span className="text-gray-400 uppercase tracking-widest font-semibold">Demo:</span>
                    <button
                        onClick={() => setUserPlan('free')}
                        className={`px-2 py-0.5 rounded transition-colors ${userPlan === 'free' ? 'bg-orange-500 text-white font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                    >
                        Free User
                    </button>
                    <button
                        onClick={() => setUserPlan('paid')}
                        className={`px-2 py-0.5 rounded transition-colors ${userPlan === 'paid' ? 'bg-orange-500 text-white font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                    >
                        Paid User
                    </button>
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
                        <h4 className="text-2xl font-bold text-slate-900 mb-2">Unlock Premium Valuation</h4>
                        <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                            Get detailed price estimates, market comparisons, and investment analysis.
                        </p>
                        <div className="space-y-4 w-full max-w-sm">
                            <Link href="/pricing" className="block w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/20">
                                Upgrade to View
                            </Link>
                            <div className="flex justify-center gap-6 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Market Data</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> Comparables</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Data (Always rendered but blurred if free) */}
                <div className={userPlan === 'free' ? 'filter blur-sm select-none opacity-50 p-6' : 'p-6'}>

                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <p className="text-sm text-orange-800 font-medium mb-1">Estimated Value</p>
                            <p className="text-3xl font-bold text-slate-900">{formatPrice(valuation.estimatedValue)}</p>
                            <p className="text-xs text-orange-600 mt-1 font-bold">High Confidence (92%)</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-600 font-medium mb-1">Price Range</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-slate-700">{formatPrice(valuation.range.min)}</span>
                                <span className="text-slate-400">-</span>
                                <span className="text-xl font-bold text-slate-700">{formatPrice(valuation.range.max)}</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-600 font-medium mb-1">Price / Sqft</p>
                            <p className="text-3xl font-bold text-slate-700">{currencySymbol}{Math.round(valuation.estimatedValue / property.specs.sqft)}</p>
                        </div>
                    </div>

                    {/* Breakdown & Comparables */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Valuation Breakdown */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-500" />
                                Valuation Factors
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                                    <span className="text-slate-600">Base Market Value</span>
                                    <span className="font-bold text-slate-700">{formatPrice(valuation.factors.basePrice)}</span>
                                </div>
                                {valuation.factors.typeAdjustment !== 0 && (
                                    <div className="flex justify-between items-center text-sm p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                        <span className="text-indigo-700 font-medium flex items-center gap-2">
                                            <Home className="w-4 h-4" /> Building Type ({property.specs.type})
                                        </span>
                                        <span className="font-bold text-indigo-700">+{formatPrice(valuation.factors.typeAdjustment)}</span>
                                    </div>
                                )}
                                {valuation.factors.floorAdjustment !== 0 && (
                                    <div className="flex justify-between items-center text-sm p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <span className="text-blue-700 font-medium flex items-center gap-2">
                                            <ArrowUpRight className="w-4 h-4" /> Floor Level
                                        </span>
                                        <span className="font-bold text-blue-700">
                                            {valuation.factors.floorAdjustment > 0 ? '+' : ''}{formatPrice(valuation.factors.floorAdjustment)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="text-emerald-700 font-medium flex items-center gap-2">
                                        <Star className="w-4 h-4" /> Features & Interior
                                    </span>
                                    <span className="font-bold text-emerald-700">+{formatPrice(valuation.factors.featureBonus + valuation.factors.interiorBonus)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Comparables */}
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Home className="w-5 h-5 text-orange-500" />
                                Comparable Properties
                            </h4>
                            <div className="space-y-3">
                                {valuation.comparables.map(comp => (
                                    <div key={comp.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-800">{comp.address}</div>
                                            <div className="text-xs text-slate-500">{comp.similarity}% Match</div>
                                        </div>
                                        <div className="font-bold text-slate-700">{formatPrice(comp.price)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-slate-500 leading-relaxed">
                                <Info className="w-4 h-4 inline mr-1 mb-0.5" />
                                Estimates based on recent sales of similar properties in {property.location.city}. Actual value may vary based on market conditions.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

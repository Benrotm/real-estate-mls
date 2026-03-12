'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Property } from '@/app/lib/properties'; // Assuming this exists or I should check. Use 'any' if unsure.
import { getSmartValuation } from '@/app/lib/actions/valuation';
import { findMatchingLeads } from '@/app/lib/actions/scoring';
import { LeadData } from '@/app/lib/types';
import { Lock, TrendingUp, Info, CheckCircle, BarChart3, Star, Home, ArrowUpRight, Sofa, Building, Layers, Search, Wind, Sun, DollarSign, Zap, User, Users, MapPin, Activity, ChevronDown, ChevronUp, Clock, List, Heart, Ban, Wallet, Smartphone, Mail, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ReferenceLine, ZAxis } from 'recharts';
import Link from 'next/link';
import { format } from 'date-fns';


interface ValuationWidgetProps {
    property: any; // Using any to avoid strict type issues if Property definition mismatches
}

export default function ValuationWidget({ property }: ValuationWidgetProps) {
    const [valuation, setValuation] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<'free' | 'paid'>('free'); // Can fetch real plan later based on requirements
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    useEffect(() => {
        async function loadValuation() {
            if (!property?.id) return;
            try {
                const result = await getSmartValuation(property.id);
                setValuation(result);

                // Load matching leads
                setIsMatchingLoading(true);
                const leads = await findMatchingLeads(property.id);
                setMatchingLeads(leads);
            } catch (e) {
                console.error("Failed to load valuation or leads", e);
            } finally {
                setLoading(false);
                setIsMatchingLoading(false);
            }
        }

        loadValuation();

        // Optional: Check user plan
        // setUserPlan('paid'); 
    }, [property]);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Smart Valuation...</div>;

    // Show full widget structure with blur overlay if no valuation available
    if (!valuation) {
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

                    {/* View As Toggle */}
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs">
                        <span className="text-gray-400 uppercase tracking-widest font-semibold">View As:</span>
                        <button type="button" onClick={() => setUserPlan('free')} className={`px-2 py-0.5 rounded ${userPlan === 'free' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Guest</button>
                        <button type="button" onClick={() => setUserPlan('paid')} className={`px-2 py-0.5 rounded ${userPlan === 'paid' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Pro</button>
                    </div>
                </div>

                {/* Content Body with Blur Overlay */}
                <div className="p-0 relative">
                    {/* Blur Overlay - only show when userPlan is 'free' (Guest) */}
                    {userPlan === 'free' && (
                        <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <Lock className="w-8 h-8 text-slate-400" />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 mb-2">Unlock Smart Valuation</h4>
                            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                                See how Air Quality, Solar Potential, and Comp Sales affect this property's true value.
                            </p>
                            <Link
                                href="/dashboard/admin/valuation/reports"
                                className="bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20"
                            >
                                Unlock Full Report
                            </Link>
                        </div>
                    )}

                    {/* Mock Data - blur only when Guest (free) is selected */}
                    <div className={`p-6 ${userPlan === 'free' ? 'filter blur-sm select-none opacity-50' : ''}`}>
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 flex flex-col justify-center">
                                <p className="text-sm text-indigo-900 font-bold uppercase tracking-wider mb-1">Estimated Value</p>
                                <p className="text-4xl font-extrabold text-slate-900">$425,000</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-slate-500">High Confidence</span>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-2 grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-emerald-50 border border-emerald-100">
                                        <Wind className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Air Quality</p>
                                        <p className="text-lg font-bold text-slate-800">Good</p>
                                        <p className="text-xs text-slate-400">AQI: 42</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-orange-50 border border-orange-100">
                                        <Sun className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 font-medium">Solar Potential</p>
                                        <p className="text-lg font-bold text-slate-800">85/100</p>
                                        <p className="text-xs text-slate-400">1,850 kWh/yr</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mock Chart Area */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
                            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Market Trend & Estimate
                            </h4>
                            <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                                <div className="flex gap-4">
                                    <div className="w-12 h-24 bg-slate-300 rounded"></div>
                                    <div className="w-12 h-32 bg-slate-300 rounded"></div>
                                    <div className="w-12 h-28 bg-slate-300 rounded"></div>
                                    <div className="w-12 h-36 bg-indigo-400 rounded"></div>
                                </div>
                            </div>
                        </div>

                        {/* Mock Comparables */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-slate-900 mb-4">Comparable Sales</h4>
                            <div className="space-y-2">
                                <div className="h-12 bg-slate-100 rounded-lg"></div>
                                <div className="h-12 bg-slate-100 rounded-lg"></div>
                                <div className="h-12 bg-slate-100 rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                        Value computed based on {property.area_usable || 0} m² in {property.location_city || 'Unknown'}.
                    </p>
                    <p className="text-xs text-slate-400">
                        Includes adjustments for AQI, Solar Potential, and Market Trends.
                    </p>
                </div>
            </div>
        );
    }

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

    // Prepare chart data
    // We want to show the estimated value vs the comparables
    const chartData = [
        ...valuation.comparables.map((comp: any) => ({
            name: 'Comp',
            price: Number(comp.sold_price),
            date: new Date(comp.sold_date),
            label: format(new Date(comp.sold_date), 'MMM yyyy'),
            type: 'comp'
        })),
        {
            name: 'Subject',
            price: valuation.estimatedValue,
            date: new Date(),
            label: 'Estimated',
            type: 'subject'
        }
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    const scatterData = valuation.comparables.map((comp: any) => ({
        x: Number(comp.sold_price),
        y: 1, // Fixed Y for one-dimensional distribution
        id: comp.id
    }));

    const medianPrice = valuation.medianComparablePrice || 0;

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
                    <button type="button" onClick={() => setUserPlan('free')} className={`px-2 py-0.5 rounded ${userPlan === 'free' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Guest</button>
                    <button type="button" onClick={() => setUserPlan('paid')} className={`px-2 py-0.5 rounded ${userPlan === 'paid' ? 'bg-indigo-500 text-white' : 'text-gray-300'}`}>Pro</button>
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
                        <button type="button" onClick={() => setUserPlan('paid')} className="bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/20">
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
                        {/* Breakdown & Chart */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Chart */}
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Market Trend & Estimate
                                </h4>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="label"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748B', fontSize: 12 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                hide={true}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F1F5F9' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [formatPrice(value), 'Price']}
                                            />
                                            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                                                {chartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.type === 'subject' ? '#6366f1' : '#cbd5e1'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className="text-xs text-slate-400 text-center mt-2">
                                    Comparables (gray) vs. Your Property Estimate (indigo)
                                </p>
                            </div>

                            {/* Recommended Price Change Card */}
                            {valuation.amenityScore > 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-emerald-900 text-lg">Recommended Price Change</h4>
                                            <p className="text-sm text-emerald-700">Based on premium features & details score</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-white/50 rounded-lg p-4 border border-emerald-100 mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Adjustment Suggestion</p>
                                            <p className="text-3xl font-black text-emerald-700">+{formatPrice(valuation.amenityScore * 100)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Score</p>
                                            <p className="text-2xl font-bold text-slate-700">{valuation.amenityScore} pts</p>
                                        </div>
                                    </div>

                                    {/* Breakdown List */}
                                    <div className="space-y-4">
                                        {Array.from(new Set(valuation.amenityBreakdown.map((item: any) => item.category))).map((cat: any) => (
                                            <div key={cat} className="space-y-1">
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] pl-1">{cat}</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {valuation.amenityBreakdown
                                                        .filter((item: any) => item.category === cat)
                                                        .map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-emerald-50 text-sm shadow-sm group hover:border-emerald-300 transition-colors">
                                                                <span className="text-slate-600 font-medium">{item.label}</span>
                                                                <span className="text-emerald-600 font-bold">+{item.points}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>Calculation: $100 increase for every 1 property point.</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                                    Market Adjustments
                                </h4>
                                {/* Base */}
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="text-slate-600">Base Market Value (area ratio)</span>
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

                                {/* Offers/Market Interest Impact */}
                                {valuation.lifestyleFactors.offers && (
                                    <div className="flex justify-between items-center p-3 bg-indigo-50/30 rounded-lg border border-indigo-100/50">
                                        <span className="text-slate-700 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-indigo-500" />
                                            Market Interest Adjustment
                                            {valuation.lifestyleFactors.offers.count > 0 && (
                                                <span className="text-xs text-slate-400 font-normal">
                                                    ({valuation.lifestyleFactors.offers.count} offer{valuation.lifestyleFactors.offers.count !== 1 ? 's' : ''})
                                                </span>
                                            )}
                                        </span>
                                        <span className={`font-bold ${valuation.lifestyleFactors.offers.impact >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                                            {valuation.lifestyleFactors.offers.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.offers.impact * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Comps List */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Home className="w-5 h-5 text-indigo-500" />
                                    Recent Comparables
                                </h4>
                                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    MEDIAN: {formatPrice(medianPrice)}
                                </div>
                            </div>

                            {/* New Distribution Graphic */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 shadow-inner">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Price Distribution</p>
                                <div className="h-16 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                                            <XAxis
                                                type="number"
                                                dataKey="x"
                                                hide={true}
                                                domain={['dataMin * 0.9', 'dataMax * 1.1']}
                                            />
                                            <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                            <ZAxis type="number" range={[100, 100]} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: '3 3' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white p-2 border border-slate-200 shadow-xl rounded-lg text-xs font-bold text-slate-700">
                                                                {formatPrice(payload[0].value as number)}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <ReferenceLine
                                                x={medianPrice}
                                                stroke="#6366f1"
                                                strokeWidth={2}
                                                label={{
                                                    position: 'top',
                                                    value: 'Median',
                                                    fill: '#6366f1',
                                                    fontSize: 10,
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                            <Scatter data={scatterData} fill="#cbd5e1" shape="circle" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-x-0 bottom-2 h-0.5 bg-slate-200 rounded-full mx-5"></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1 px-1">
                                    <span>Lower</span>
                                    <span>Higher</span>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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

                    {/* Potential Buyers Card */}
                    <div className="mt-12 pt-12 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="font-bold text-slate-900 text-xl flex items-center gap-2">
                                    <Zap className="w-6 h-6 text-orange-500 fill-current animate-pulse" />
                                    Potential Buyers
                                </h4>
                                <p className="text-sm text-slate-500">AI-matched leads compatible with this property</p>
                            </div>
                            {matchingLeads.length > 0 && (
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Highest Budget</span>
                                    <span className="text-xl font-black text-emerald-600">
                                        {formatPrice(Math.max(...matchingLeads.map(l => l.budget_max || 0)))}
                                    </span>
                                </div>
                            )}
                        </div>

                        {matchingLeads.length === 0 ? (
                            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h5 className="font-bold text-slate-600">No Matched Leads Found</h5>
                                <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">
                                    Our matching engine couldn't find leads that fit this property's specific profile right now.
                                </p>
                            </div>
                        ) : (() => {
                            const leadBudgets = matchingLeads.map(l => Number(l.budget_max || 0)).filter(b => b > 0).sort((a, b) => a - b);
                            const minBudget = leadBudgets[0] || 0;
                            const maxBudget = leadBudgets[leadBudgets.length - 1] || 0;
                            const medianBudget = leadBudgets.length > 0
                                ? (leadBudgets.length % 2 === 0
                                    ? (leadBudgets[leadBudgets.length / 2 - 1] + leadBudgets[leadBudgets.length / 2]) / 2
                                    : leadBudgets[Math.floor(leadBudgets.length / 2)])
                                : 0;

                            const budgetScatterData = matchingLeads.map(l => ({
                                x: Number(l.budget_max || 0),
                                y: 1,
                                name: l.name || 'Partner Lead'
                            }));

                            return (
                                <div className="space-y-8">
                                    {/* Budget Distribution Graphic */}
                                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100 rounded-2xl p-6 shadow-inner">
                                        <div className="flex justify-between items-center mb-4">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Buyer Budget Distribution</p>
                                            <div className="flex gap-4">
                                                <div className="text-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Min</span>
                                                    <p className="text-xs font-black text-slate-700">{formatPrice(minBudget)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Median</span>
                                                    <p className="text-xs font-black text-indigo-700">{formatPrice(medianBudget)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Max</span>
                                                    <p className="text-xs font-black text-slate-700">{formatPrice(maxBudget)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-20 w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                                                    <XAxis
                                                        type="number"
                                                        dataKey="x"
                                                        hide={false}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                                                        stroke="#94a3b8"
                                                        fontSize={9}
                                                        fontWeight="black"
                                                        domain={['dataMin * 0.9', 'dataMax * 1.1']}
                                                    />
                                                    <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                                    <ZAxis type="number" range={[120, 120]} />
                                                    <Tooltip
                                                        cursor={{ strokeDasharray: '3 3' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                return (
                                                                    <div className="bg-slate-900 text-white p-2 border-none shadow-xl rounded-lg text-xs font-bold">
                                                                        <div className="text-slate-400 mb-1">{payload[0].payload.name}</div>
                                                                        {formatPrice(payload[0].value as number)}
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <ReferenceLine
                                                        x={medianBudget}
                                                        stroke="#6366f1"
                                                        strokeWidth={2}
                                                        strokeDasharray="3 3"
                                                        label={{
                                                            position: 'top',
                                                            value: 'Median Budget',
                                                            fill: '#6366f1',
                                                            fontSize: 10,
                                                            fontWeight: 'bold'
                                                        }}
                                                    />
                                                    <Scatter data={budgetScatterData} fill="#6366f1" shape="circle" fillOpacity={0.6} />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Lead List */}
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div
                                            className="bg-slate-900 px-6 py-4 flex justify-between items-center cursor-pointer group hover:bg-slate-800 transition-colors"
                                            onClick={() => setIsTableExpanded(!isTableExpanded)}
                                        >
                                            <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/20">
                                                        {matchingLeads.length}
                                                    </div>
                                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">Potential Buyer</div>
                                                </div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center text-center">Match Score</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center text-center">Budget</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest self-center text-center">Urgency</div>
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-white transition-colors">{isTableExpanded ? 'Hide' : 'Show'}</span>
                                                    {isTableExpanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white transition-transform group-hover:translate-y-0.5" />}
                                                </div>
                                            </div>
                                        </div>
                                        {isTableExpanded && (
                                            <div className="overflow-x-auto border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                                <div className="min-w-[700px]">
                                                    <div className="divide-y divide-slate-100">
                                                        {matchingLeads.map((lead: any, index: number) => (
                                                            <Fragment key={lead.id}>
                                                                <div
                                                                    onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                                                    className={`cursor-pointer transition-all grid grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 items-center px-6 py-4 border-b border-slate-50 last:border-none ${expandedLeadId === lead.id ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shadow-sm">
                                                                            B
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-bold text-slate-900">Buyer #{index + 1}</div>
                                                                            <div className="text-[10px] text-slate-400 uppercase font-black">{lead.preference_type || 'Any Property'}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-black ${lead.match_score >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                            {lead.match_score} pts
                                                                        </div>
                                                                    </div>
                                                                    <div className="font-extrabold text-slate-700 text-center">
                                                                        {formatPrice(lead.budget_max || 0)}
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <span className="text-xs font-black text-slate-500">{lead.move_urgency || 'Normal'}</span>
                                                                    </div>
                                                                    <div className="text-right flex justify-end pr-2">
                                                                        {expandedLeadId === lead.id ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />}
                                                                    </div>
                                                                </div>
                                                                {expandedLeadId === lead.id && (
                                                                    <div className="bg-slate-50/50 p-6">
                                                                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                                            {/* Profile Header */}
                                                                            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black border border-indigo-500/30">
                                                                                        B
                                                                                    </div>
                                                                                    <div>
                                                                                        <h5 className="font-bold text-lg">Buyer #{index + 1}</h5>
                                                                                        <div className="flex items-center gap-3 text-slate-400 text-xs font-medium">
                                                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Seen {new Date().toLocaleDateString()}</span>
                                                                                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                                                            <span>ID: {lead.id.slice(0, 8)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Match Rating</div>
                                                                                    <div className="text-2xl font-black text-orange-400 flex items-center gap-2">
                                                                                        {lead.match_score}% <Activity className="w-5 h-5" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                                                {/* Column 1: Profile */}
                                                                                <div className="space-y-6">
                                                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                                        <User className="w-4 h-4 text-indigo-500" />
                                                                                        <h6 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Consumer Profile</h6>
                                                                                    </div>
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Occupation</label>
                                                                                            <div className="text-sm font-bold text-slate-900">{lead.occupation || 'Executive / Professional'}</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Marital Status</label>
                                                                                            <div className="text-sm font-bold text-slate-900">{lead.marital_status || 'Married'} • {lead.kids_count || 0} Kids</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Living Situation</label>
                                                                                            <div className="text-sm font-bold text-slate-900">{lead.living_situation || 'Rented Apartment'}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Column 2: Requirements */}
                                                                                <div className="space-y-6">
                                                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                                        <Home className="w-4 h-4 text-indigo-500" />
                                                                                        <h6 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Search Requirements</h6>
                                                                                    </div>
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Property Type</label>
                                                                                            <div className="text-sm font-bold text-slate-900">{lead.preference_listing_type} {lead.preference_type}</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Location Preference</label>
                                                                                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.preference_location_city || 'Central Areas'}</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Rooms / Space</label>
                                                                                            <div className="text-sm font-bold text-slate-900">{lead.preference_rooms_min || 3} Rooms • {lead.preference_surface_min || 80}m²+</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Column 3: Logic & Intent */}
                                                                                <div className="space-y-6">
                                                                                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                                        <Zap className="w-4 h-4 text-indigo-500" />
                                                                                        <h6 className="font-black text-slate-900 text-[10px] uppercase tracking-widest">Business Intent</h6>
                                                                                    </div>
                                                                                    <div className="space-y-4">
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Buying Reason</label>
                                                                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold">
                                                                                                <Heart className="w-3 h-3 text-red-400 fill-current" /> {lead.buying_reason || 'Personal Living'}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Financial Plan</label>
                                                                                            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                                                                <Wallet className="w-3.5 h-3.5 text-slate-400" /> {lead.payment_method || 'Mortgage'}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Contact Priority</label>
                                                                                            <div className="text-sm font-bold text-orange-600">{lead.move_urgency || 'High'}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Notes Section with Premium Style */}
                                                                            <div className="p-8 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {lead.social_notes && (
                                                                                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Star className="w-3 h-3 text-emerald-600 fill-current" />
                                                                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Key Preferences</span>
                                                                                        </div>
                                                                                        <p className="text-sm text-emerald-900 font-medium italic">"{lead.social_notes}"</p>
                                                                                    </div>
                                                                                )}
                                                                                {lead.negative_preferences && (
                                                                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                                                        <div className="flex items-center gap-2 mb-2">
                                                                                            <Ban className="w-3 h-3 text-red-600" />
                                                                                            <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Deal Breakers</span>
                                                                                        </div>
                                                                                        <p className="text-sm text-red-900 font-medium italic">"{lead.negative_preferences}"</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                </div>
            </div>
        </div>
    );
}

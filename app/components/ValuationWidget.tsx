'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Property } from '@/app/lib/properties'; // Assuming this exists or I should check. Use 'any' if unsure.
import { getSmartValuation } from '@/app/lib/actions/valuation';
import { findMatchingLeads } from '@/app/lib/actions/scoring';
import { LeadData } from '@/app/lib/types';
import { Lock, TrendingUp, Info, CheckCircle, BarChart3, Star, Home, ArrowUpRight, Sofa, Building, Layers, Search, Wind, Sun, DollarSign, Zap, User, Users, MapPin, Activity, ChevronDown, ChevronUp, Clock, List, Heart, Ban, Wallet, Smartphone, Mail, MessageSquare, Target, Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ReferenceLine, ZAxis, ComposedChart, Legend, Line } from 'recharts';
import Link from 'next/link';
import { format } from 'date-fns';
import { getMarketAnalyticsData, AnalyticsData } from '@/app/lib/actions/analytics';


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
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

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
                setIsMatchingLoading(false);

                // Load market analytics
                setIsAnalyticsLoading(true);
                try {
                    const analytics = await getMarketAnalyticsData({
                        timeRange: '6m',
                        propertyType: property.type || 'All',
                        category: property.listing_type === 'For Sale' ? 'Sale' : 'Rent',
                        city: property.location_city || '',
                        scope: 'all'
                    });
                    setAnalyticsData(analytics);
                } catch (err) {
                    console.error("Error loading market analytics:", err);
                } finally {
                    setIsAnalyticsLoading(false);
                }
            } catch (e) {
                console.error("Failed to load valuation or leads", e);
            } finally {
                setLoading(false);
            }
        }

        loadValuation();
    }, [property]);



    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Smart Valuation...</div>;

    // Show full widget structure with blur overlay if no valuation available
    if (!valuation) {
        return (
            <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden my-8 scroll-mt-24 relative" id="valuation">
                {/* Glow Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -ml-64 -mb-64" />

                {/* Header */}
                <div className="bg-slate-900/50 backdrop-blur-xl p-6 flex justify-between items-center text-white border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl border border-white/10 shadow-lg">
                            <TrendingUp className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl tracking-tight">Smart Valuation Engine</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lifestyle-Adjusted Market Estimate</p>
                            </div>
                        </div>
                    </div>

                    {/* View As Toggle */}
                    <div className="flex items-center gap-1.5 bg-slate-800/50 border border-white/5 p-1.5 rounded-full">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black ml-2 mr-1">View As:</span>
                        <button type="button" onClick={() => setUserPlan('free')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'free' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'}`}>Guest</button>
                        <button type="button" onClick={() => setUserPlan('paid')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'paid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'}`}>Pro</button>
                    </div>
                </div>

                {/* Content Body with Blur Overlay */}
                <div className="p-0 relative">
                    {/* Blur Overlay - only show when userPlan is 'free' (Guest) */}
                    {userPlan === 'free' && (
                        <div className="absolute inset-0 z-10 backdrop-blur-md bg-slate-950/60 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 flex items-center justify-center mb-8 relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                <Lock className="w-8 h-8 text-indigo-400 relative z-10" />
                            </div>
                            <h4 className="text-3xl font-black text-white mb-3 tracking-tight">Unlock Smart Valuation</h4>
                            <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                                See how Air Quality, Solar Potential, and Comp Sales affect this property's true value.
                            </p>
                            <Link
                                href="/dashboard/admin/valuation/reports"
                                className="bg-indigo-600 text-white py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Unlock Full Report
                            </Link>
                        </div>
                    )}

                    {/* Mock Data - blur only when Guest (free) is selected */}
                    <div className={`p-8 ${userPlan === 'free' ? 'filter blur-md select-none opacity-20' : ''}`}>
                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Estimated Value</p>
                                <p className="text-4xl font-black text-white">$425,000</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">High Confidence</span>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 col-span-2 grid grid-cols-2 gap-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                        <Wind className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Air Quality</p>
                                        <p className="text-xl font-bold text-white">Good</p>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">AQI: 42</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                        <Sun className="w-6 h-6 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Solar Potential</p>
                                        <p className="text-xl font-bold text-white">85/100</p>
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mt-1">1,850 kWh/yr</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mock Chart Area */}
                        <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-white/5 mb-8">
                            <h4 className="text-sm font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Market Trend & Estimate
                            </h4>
                            <div className="h-56 bg-white/5 rounded-2xl flex items-end justify-center p-8 gap-4">
                                <div className="w-full bg-slate-800/50 rounded-lg animate-pulse" style={{ height: '40%' }}></div>
                                <div className="w-full bg-slate-800/50 rounded-lg animate-pulse" style={{ height: '60%' }}></div>
                                <div className="w-full bg-slate-800/50 rounded-lg animate-pulse" style={{ height: '55%' }}></div>
                                <div className="w-full bg-indigo-500/30 rounded-lg animate-pulse border-t-2 border-indigo-400" style={{ height: '75%' }}></div>
                            </div>
                        </div>

                        {/* Mock Comparables */}
                        <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-white/5">
                            <h4 className="text-sm font-black text-white mb-6 uppercase tracking-widest">Comparable Sales</h4>
                            <div className="space-y-4">
                                <div className="h-14 bg-white/5 rounded-xl border border-white/5 animate-pulse"></div>
                                <div className="h-14 bg-white/5 rounded-xl border border-white/5 animate-pulse delay-75"></div>
                                <div className="h-14 bg-white/5 rounded-xl border border-white/5 animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-900/50 backdrop-blur-md p-6 text-center border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Value computed based on {property.area_usable || 0} m² in {property.location_city || 'Unknown'}.
                    </p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
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
        if (aqi <= 50) return 'text-emerald-400';
        if (aqi <= 100) return 'text-yellow-400';
        return 'text-rose-400';
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
        <div className="bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden my-8 scroll-mt-24 relative" id="valuation">
            {/* Glow Background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -ml-64 -mb-64" />

            {/* Header */}
            <div className="bg-slate-900/50 backdrop-blur-xl p-6 flex justify-between items-center text-white border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl border border-white/10 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-xl tracking-tight">Smart Valuation Engine</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lifestyle-Adjusted Market Estimate</p>
                        </div>
                    </div>
                </div>

                {/* Demo Control */}
                <div className="flex items-center gap-1.5 bg-slate-800/50 border border-white/5 p-1.5 rounded-full">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black ml-2 mr-1">View As:</span>
                    <button type="button" onClick={() => setUserPlan('free')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'free' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'}`}>Guest</button>
                    <button type="button" onClick={() => setUserPlan('paid')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'paid' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-slate-300'}`}>Pro</button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-0 relative">

                {/* Blur Overlay for Free Users */}
                {userPlan === 'free' && (
                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-slate-950/60 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 flex items-center justify-center mb-8 relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            <Lock className="w-8 h-8 text-indigo-400 relative z-10" />
                        </div>
                        <h4 className="text-3xl font-black text-white mb-3 tracking-tight">Unlock Smart Valuation</h4>
                        <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                            See how Air Quality, Solar Potential, and Comp Sales affect this property's true value.
                        </p>
                        <button type="button" onClick={() => setUserPlan('paid')} className="bg-indigo-600 text-white py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98]">
                            Unlock Full Report
                        </button>
                    </div>
                )}

                {/* Main Data */}
                <div className={userPlan === 'free' ? 'filter blur-md select-none opacity-20 p-8' : 'p-8'}>

                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
                            <div className="relative z-10">
                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-400" />
                                    Estimated Value
                                </p>
                                <h3 className="text-4xl font-black text-white">{formatPrice(valuation.estimatedValue)}</h3>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className={`h-2.5 w-2.5 rounded-full ${valuation.confidenceScore > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
                                    <span className="text-xs font-bold text-slate-400">
                                        {valuation.confidenceScore > 80 ? 'High Confidence' : 'Moderate Confidence'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle Factors Summary */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl relative overflow-hidden group col-span-2 grid grid-cols-2 gap-6">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-all" />

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                                    <Wind className={`w-6 h-6 ${getAqiColor(valuation.lifestyleFactors.aqi.value)}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Air Quality</p>
                                    <p className="text-lg font-bold text-white leading-tight">{valuation.lifestyleFactors.aqi.category}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                            AQI: {valuation.lifestyleFactors.aqi.value}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-lg shadow-orange-500/5">
                                    <Sun className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Solar Potential</p>
                                    <p className="text-lg font-bold text-white leading-tight">{valuation.lifestyleFactors.solar.score}/100</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                                            {Math.round(valuation.lifestyleFactors.solar.kwh).toLocaleString()} kWh/yr
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Breakdown & Chart */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Market Price Trends (Area Chart) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                <div className="flex justify-between items-center mb-6 relative z-10">
                                    <div>
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                                            Market Price Trends
                                        </h4>
                                        <p className="text-xs text-slate-400">Historical performance in {property.location_city}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Data</span>
                                    </div>
                                </div>
                                <div className="h-64 w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={analyticsData?.trends ? [...analyticsData.trends].reverse() : chartData}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="valPriceGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis
                                                dataKey={analyticsData ? "date" : "label"}
                                                stroke="#64748b"
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                                formatter={(value: any) => [formatPrice(value), 'Price']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey={analyticsData ? "avgPrice" : "price"}
                                                stroke="#10b981"
                                                fillOpacity={1}
                                                fill="url(#valPriceGrad)"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Supply vs Demand Dynamics (New Card) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-purple-400" />
                                            Supply vs Demand Dynamics
                                        </h4>
                                        <p className="text-xs text-slate-400">Comparing active properties against buyer leads</p>
                                    </div>
                                </div>
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart
                                            data={analyticsData?.trends ? [...analyticsData.trends].reverse() : []}
                                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="valSupplyGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                            <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fill: '#8b5cf6', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                                itemStyle={{ color: '#e2e8f0' }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} />
                                            <Bar yAxisId="left" dataKey="supply" name="New Supply" fill="url(#valSupplyGrad)" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line yAxisId="right" type="monotone" dataKey="demand" name="Lead Demand" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0f172a' }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recommended Price Change Card */}
                            {valuation.amenityScore > 0 && (
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Recommended Price Change</h4>
                                            <p className="text-xs text-slate-400">Based on premium features & property score</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-950/50 rounded-xl p-5 border border-slate-800 mb-6 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Adjustment Suggestion</p>
                                            <p className="text-3xl font-black text-white">+{formatPrice(valuation.amenityScore * 100)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact Score</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-2xl font-black text-white">{valuation.amenityScore}</span>
                                                <span className="text-xs text-slate-500 font-bold">pts</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown List */}
                                    <div className="space-y-6 relative z-10">
                                        {Array.from(new Set(valuation.amenityBreakdown.map((item: any) => item.category))).map((cat: any) => (
                                            <div key={cat} className="space-y-2">
                                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{cat}</h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {valuation.amenityBreakdown
                                                        .filter((item: any) => item.category === cat)
                                                        .map((item: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center bg-slate-950/30 px-3 py-2.5 rounded-xl border border-slate-800 text-sm hover:bg-slate-800/50 transition-colors group">
                                                                <span className="text-slate-300 font-medium">{item.label}</span>
                                                                <span className="text-emerald-400 font-black">+{item.points}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                                        <Info className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Formula: {currencySymbol}100 increase per property point.</span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                                    Market Adjustments
                                </h4>
                                <div className="space-y-3">
                                    {/* Base */}
                                    <div className="flex justify-between items-center p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors">
                                        <span className="text-sm text-slate-400 font-medium">Base Market Value (area ratio)</span>
                                        <span className="text-lg font-bold text-white">{formatPrice(valuation.baseValue)}</span>
                                    </div>

                                    {/* AQI Impact */}
                                    <div className="flex justify-between items-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors">
                                        <span className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                            <Wind className="w-4 h-4 text-emerald-400" />
                                            Air Quality Adjustment
                                        </span>
                                        <span className={`text-lg font-black ${valuation.lifestyleFactors.aqi.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {valuation.lifestyleFactors.aqi.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.aqi.impact * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Solar Impact */}
                                    <div className="flex justify-between items-center p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl hover:bg-orange-500/10 transition-colors">
                                        <span className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                            <Sun className="w-4 h-4 text-orange-400" />
                                            Solar Potential Bonus
                                        </span>
                                        <span className="text-lg font-black text-orange-400">
                                            {valuation.lifestyleFactors.solar.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.solar.impact * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Offers/Market Interest Impact */}
                                    {valuation.lifestyleFactors.offers && (
                                        <div className="flex justify-between items-center p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl hover:bg-indigo-500/10 transition-colors">
                                            <span className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-indigo-400" />
                                                Market Interest Adjustment
                                                {valuation.lifestyleFactors.offers.count > 0 && (
                                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-bold ml-1">
                                                        {valuation.lifestyleFactors.offers.count} offers
                                                    </span>
                                                )}
                                            </span>
                                            <span className={`text-lg font-black ${valuation.lifestyleFactors.offers.impact >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                                                {valuation.lifestyleFactors.offers.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.offers.impact * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Recent Comparables (Right Column) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Home className="w-5 h-5 text-indigo-400" />
                                    Recent Comparables
                                </h4>
                                <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-full uppercase tracking-widest">
                                    MEDIAN: {formatPrice(medianPrice)}
                                </div>
                            </div>

                            {/* Price Distribution Graphic */}
                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 mb-8 relative z-10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Market Positioning</p>
                                <div className="h-20 w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                            <XAxis
                                                type="number"
                                                dataKey="x"
                                                hide={false}
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#475569', fontSize: 9, fontWeight: 'black' }}
                                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                                                domain={['dataMin * 0.95', 'dataMax * 1.05']}
                                            />
                                            <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                            <ZAxis type="number" range={[100, 100]} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-slate-900 px-2 py-1 border border-slate-800 rounded shadow-xl text-[10px] font-black text-white">
                                                                {formatPrice(payload[0].value as number)}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <ReferenceLine
                                                x={medianPrice}
                                                stroke="#818cf8"
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                                label={{
                                                    position: 'top',
                                                    value: 'Median',
                                                    fill: '#818cf8',
                                                    fontSize: 9,
                                                    fontWeight: 'black',
                                                    textAnchor: 'middle'
                                                }}
                                            />
                                            <Scatter data={scatterData} fill="#334155" shape="circle" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-x-0 bottom-[14px] h-[1px] bg-slate-800 mx-2"></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-slate-600 mt-2 px-1 uppercase tracking-tighter">
                                    <span>Below Market</span>
                                    <span>Above Market</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[600px] relative z-10">
                                {valuation.comparables.map((comp: any) => (
                                    <div key={comp.id} className="flex flex-col p-4 bg-slate-950/30 border border-slate-800/50 rounded-xl hover:bg-slate-800/50 transition-all group">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-black text-white">{formatPrice(Number(comp.sold_price))}</span>
                                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{new Date(comp.sold_date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-slate-400 text-xs truncate font-medium group-hover:text-slate-300 transition-colors">
                                            {comp.properties?.address || 'Address hidden'}
                                        </div>
                                        <div className="mt-3 flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                {comp.properties?.rooms} Beds
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                                {comp.properties?.area_usable} m²
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {valuation.comparables.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic text-sm text-center">
                                        <Ban className="w-8 h-8 mb-2 opacity-20" />
                                        <p>No direct comparables found nearby.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Potential Buyers Card */}
                    <div className="mt-12 pt-12 border-t border-slate-800">
                        {matchingLeads.length === 0 ? (
                            <div className="bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-800 p-12 text-center">
                                <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                <h5 className="font-bold text-slate-400">No Matched Leads Found</h5>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
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
                                name: l.name || 'Private Buyer'
                            }));

                            return (
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

                                    <div className="flex justify-between items-center mb-8 relative z-10">
                                        <div>
                                            <h4 className="text-2xl font-black text-white flex items-center gap-3">
                                                <Zap className="w-8 h-8 text-orange-400 fill-orange-400/20 animate-pulse" />
                                                Potential Buyers
                                            </h4>
                                            <p className="text-sm text-slate-400 font-medium">Verified leads matching this property's unique profile</p>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
                                            <Users className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm font-black text-white">{matchingLeads.length} Matching</span>
                                        </div>
                                    </div>

                                    <div className="space-y-10 relative z-10">
                                        {/* Distribution Section */}
                                        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Budget Distribution</p>
                                                    <p className="text-xs text-slate-500">Comparing lead budgets against estimated value</p>
                                                </div>
                                                <div className="flex gap-6">
                                                    <div className="text-center">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min</span>
                                                        <p className="text-sm font-black text-white">{formatPrice(minBudget)}</p>
                                                    </div>
                                                    <div className="text-center relative px-4">
                                                        <div className="absolute inset-x-0 top-0 bottom-0 bg-indigo-500/10 blur-[10px] rounded-full" />
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest relative z-10">Median</span>
                                                        <p className="text-sm font-black text-white relative z-10">{formatPrice(medianBudget)}</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max</span>
                                                        <p className="text-sm font-black text-white">{formatPrice(maxBudget)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-24 w-full relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <ScatterChart margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
                                                        <XAxis
                                                            type="number"
                                                            dataKey="x"
                                                            hide={false}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                                                            stroke="#475569"
                                                            fontSize={9}
                                                            fontWeight="black"
                                                            domain={['dataMin * 0.9', 'dataMax * 1.1']}
                                                        />
                                                        <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                                        <ZAxis type="number" range={[150, 150]} />
                                                        <Tooltip
                                                            cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    return (
                                                                        <div className="bg-slate-900 text-white px-3 py-2 border border-slate-800 shadow-2xl rounded-lg text-xs font-black">
                                                                            <div className="text-slate-500 mb-1">Potential Buyer</div>
                                                                            {formatPrice(payload[0].value as number)}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <ReferenceLine
                                                            x={medianBudget}
                                                            stroke="#818cf8"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                        />
                                                        <Scatter data={budgetScatterData} fill="#6366f1" shape="circle">
                                                            {budgetScatterData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill="#6366f1" fillOpacity={0.6} />
                                                            ))}
                                                        </Scatter>
                                                    </ScatterChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Lead List Table */}
                                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group/table">
                                            <div
                                                className="bg-slate-900 border-b border-slate-800/50 px-6 py-5 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition-all"
                                                onClick={() => setIsTableExpanded(!isTableExpanded)}
                                            >
                                                <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-indigo-500/30">
                                                            {matchingLeads.length}
                                                        </div>
                                                        <div className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Qualified Leads</div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center text-center">Match Rating</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center text-center">Max Budget</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest self-center text-center">Interest</div>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{isTableExpanded ? 'Collapse' : 'Expand'}</span>
                                                        {isTableExpanded ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />}
                                                    </div>
                                                </div>
                                            </div>
                                            {isTableExpanded && (
                                                <div className="overflow-x-auto border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="min-w-[700px]">
                                                        <div className="divide-y divide-slate-800/30">
                                                            {matchingLeads.map((lead: any, index: number) => (
                                                                <Fragment key={lead.id}>
                                                                    <div
                                                                        onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                                                        className={`cursor-pointer transition-all grid grid-cols-[1.5fr,1fr,1fr,1fr,100px] gap-4 items-center px-6 py-5 border-b border-slate-800/30 last:border-none ${expandedLeadId === lead.id ? 'bg-indigo-500/5' : 'hover:bg-slate-800/50'}`}
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center text-xs font-black shadow-lg">
                                                                                BY
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">Buyer #{index + 1}</div>
                                                                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{lead.preference_type || 'Private Investor'}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lead.match_score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                                                {lead.match_score}% Match
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-black text-white text-center text-base tracking-tight">
                                                                            {formatPrice(lead.budget_max || 0)}
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-[0.1em] ${lead.move_urgency === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400'}`}>
                                                                                {lead.move_urgency || 'Normal'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-right flex justify-end pr-2">
                                                                            {expandedLeadId === lead.id ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />}
                                                                        </div>
                                                                    </div>
                                                                    {expandedLeadId === lead.id && (
                                                                        <div className="bg-slate-900/40 p-6 border-b border-slate-800/50">
                                                                            <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                                                {/* Profile Header */}
                                                                                <div className="bg-slate-950 p-6 text-white flex justify-between items-center border-b border-slate-800">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl font-black border border-indigo-500/30">
                                                                                            B
                                                                                        </div>
                                                                                        <div>
                                                                                            <h5 className="font-bold text-lg text-white">Buyer #{index + 1}</h5>
                                                                                            <div className="flex items-center gap-3 text-slate-500 text-xs font-medium">
                                                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {new Date().toLocaleDateString()}</span>
                                                                                                <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                                                                                                <span>ID: {lead.id.slice(0, 8).toUpperCase()}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">Engagement Score</div>
                                                                                        <div className="text-2xl font-black text-orange-400 flex items-center gap-2">
                                                                                            {lead.match_score}% <Activity className="w-5 h-5" />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-slate-900/50">
                                                                                    {/* Column 1: Profile */}
                                                                                    <div className="space-y-6">
                                                                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                                                                            <User className="w-4 h-4 text-indigo-400" />
                                                                                            <h6 className="font-black text-white text-[10px] uppercase tracking-widest">Consumer Profile</h6>
                                                                                        </div>
                                                                                        <div className="space-y-4">
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Occupation</label>
                                                                                                <div className="text-sm font-bold text-slate-200">{lead.occupation || 'Executive / Professional'}</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Marital Status</label>
                                                                                                <div className="text-sm font-bold text-slate-200">{lead.marital_status || 'Married'} • {lead.kids_count || 0} Kids</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Living Situation</label>
                                                                                                <div className="text-sm font-bold text-slate-200">{lead.living_situation || 'Private Residence'}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Column 2: Requirements */}
                                                                                    <div className="space-y-6">
                                                                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                                                                            <Home className="w-4 h-4 text-indigo-400" />
                                                                                            <h6 className="font-black text-white text-[10px] uppercase tracking-widest">Search Scope</h6>
                                                                                        </div>
                                                                                        <div className="space-y-4">
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Listing Type</label>
                                                                                                <div className="text-sm font-bold text-slate-200">{lead.preference_listing_type} {lead.preference_type}</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Target Area</label>
                                                                                                <div className="text-sm font-bold text-slate-200 flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.preference_location_city || 'Regional'}</div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Size Preference</label>
                                                                                                <div className="text-sm font-bold text-slate-200">{lead.preference_rooms_min || 3} Rooms • {lead.preference_surface_min || 80}m²+</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Column 3: Intent */}
                                                                                    <div className="space-y-6">
                                                                                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                                                                                            <Zap className="w-4 h-4 text-indigo-400" />
                                                                                            <h6 className="font-black text-white text-[10px] uppercase tracking-widest">Purchase Intent</h6>
                                                                                        </div>
                                                                                        <div className="space-y-4">
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Primary Motivation</label>
                                                                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 text-slate-200 rounded-md text-[10px] font-bold border border-slate-700">
                                                                                                    <Heart className="w-3 h-3 text-rose-400 fill-current" /> {lead.buying_reason || 'Personal Living'}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Payment Plan</label>
                                                                                                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                                                                                    <Wallet className="w-3.5 h-3.5 text-slate-500" /> {lead.payment_method || 'Financial Mortgage'}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Priority Level</label>
                                                                                                <div className="text-sm font-bold text-orange-400">{lead.move_urgency || 'Market Standard'}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Bottom section with notes */}
                                                                                <div className="p-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/50">
                                                                                    {lead.social_notes && (
                                                                                        <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                <Star className="w-3 h-3 text-indigo-400 fill-current" />
                                                                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Strategic Preferences</span>
                                                                                            </div>
                                                                                            <p className="text-sm text-slate-300 font-medium italic">"{lead.social_notes}"</p>
                                                                                        </div>
                                                                                    )}
                                                                                    {lead.negative_preferences && (
                                                                                        <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                <Ban className="w-3 h-3 text-rose-400" />
                                                                                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Restraints</span>
                                                                                            </div>
                                                                                            <p className="text-sm text-slate-300 font-medium italic">"{lead.negative_preferences}"</p>
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
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

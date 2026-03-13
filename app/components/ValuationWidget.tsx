'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Property } from '@/app/lib/properties'; // Assuming this exists or I should check. Use 'any' if unsure.
import { getSmartValuation } from '@/app/lib/actions/valuation';
import { findMatchingLeads } from '@/app/lib/actions/scoring';
import { LeadData } from '@/app/lib/types';
import { Lock, TrendingUp, Info, CheckCircle, BarChart3, Star, Home, ArrowUpRight, Sofa, Building, Layers, Search, Wind, Sun, DollarSign, Zap, User, Users, MapPin, Activity, ChevronDown, ChevronUp, Clock, List, Heart, Ban, Wallet, Smartphone, Mail, MessageSquare, Target, Calculator, Navigation, Award, Tag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ScatterChart, Scatter, ReferenceLine, ZAxis, ComposedChart, Legend, Line } from 'recharts';
import { getMarketAnalyticsData, AnalyticsData } from '@/app/lib/actions/analytics';
import Link from 'next/link';
import { format } from 'date-fns';

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
};

interface ValuationWidgetProps {
    property: any; // Using any to avoid strict type issues if Property definition mismatches
}

export default function ValuationWidget({ property }: ValuationWidgetProps) {
    const [valuation, setValuation] = useState<any | null>(null);
    const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [isTableExpanded, setIsTableExpanded] = useState(false);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userPlan, setUserPlan] = useState<'free' | 'paid'>('free');

    // Pricing Strategy State
    const [adjustedPrice, setAdjustedPrice] = useState<number>(property?.price || 0);
    const [targetDays, setTargetDays] = useState<number>(90);
    const [isCalculating, setIsCalculating] = useState(false);
    const [lastAdjustmentSource, setLastAdjustmentSource] = useState<'price' | 'days'>('price');

    useEffect(() => {
        if (property?.price && adjustedPrice === 0) {
            setAdjustedPrice(property.price);
        }
    }, [property?.price]);

    useEffect(() => {
        async function loadValuation() {
            if (!property?.id) return;
            try {
                const [valResult, analyticsResult] = await Promise.all([
                    getSmartValuation(property.id),
                    getMarketAnalyticsData({
                        timeRange: '6m',
                        propertyType: property.type,
                        category: property.listing_type === 'For Sale' ? 'Sale' : 'Rent',
                        city: property.location_city
                    }).catch(err => {
                        console.error("Analytics fetch failed", err);
                        return null;
                    })
                ]);
                setValuation(valResult);
                setAnalyticsData(analyticsResult);

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
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden my-8 scroll-mt-24 relative" id="valuation">
                {/* Header */}
                <div className="bg-gray-50 p-6 flex justify-between items-center text-slate-900 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl tracking-tight text-slate-900">Smart Valuation Engine</h3>
                            <div className="flex items-center gap-2">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-slate-500">Lifestyle-Adjusted Market Estimate</p>
                            </div>
                        </div>
                    </div>

                    {/* View As Toggle */}
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-full">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black ml-2 mr-1">View As:</span>
                        <button type="button" onClick={() => setUserPlan('free')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'free' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Guest</button>
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
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Estimated Value</p>
                                <p className="text-4xl font-black text-slate-900">$425,000</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm"></div>
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">High Confidence</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 col-span-2 grid grid-cols-2 gap-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Wind className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Air Quality</p>
                                        <p className="text-xl font-bold text-slate-900">Good</p>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">AQI: 42</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                        <Sun className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Solar Potential</p>
                                        <p className="text-xl font-bold text-slate-900">85/100</p>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">1,850 kWh/yr</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mock Chart Area */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 mb-8">
                            <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <TrendingUp className="w-5 h-5 text-indigo-500" />
                                Market Trend & Estimate
                            </h4>
                            <div className="h-56 bg-gray-50 rounded-2xl flex items-end justify-center p-8 gap-4">
                                <div className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ height: '40%' }}></div>
                                <div className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ height: '60%' }}></div>
                                <div className="w-full bg-gray-200 rounded-lg animate-pulse" style={{ height: '55%' }}></div>
                                <div className="w-full bg-indigo-100 rounded-lg animate-pulse border-t-2 border-indigo-400" style={{ height: '75%' }}></div>
                            </div>
                        </div>

                        {/* Mock Comparables */}
                        <div className="bg-white p-8 rounded-2xl border border-gray-100">
                            <h4 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Comparable Sales</h4>
                            <div className="space-y-4">
                                <div className="h-14 bg-gray-50 rounded-xl border border-gray-100 animate-pulse"></div>
                                <div className="h-14 bg-gray-50 rounded-xl border border-gray-100 animate-pulse delay-75"></div>
                                <div className="h-14 bg-gray-50 rounded-xl border border-gray-100 animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-6 text-center border-t border-gray-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Value computed based on {property.area_usable || 0} m² in {property.location_city || 'Unknown'}.
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Includes adjustments for AQI, Solar Potential, and Market Trends.
                    </p>
                </div>
            </div>
        );
    }

    const currencySymbol = property.currency === 'USD' ? '$' : '€';

    const getAqiColor = (aqi: number) => {
        if (aqi <= 50) return 'text-emerald-500';
        if (aqi <= 100) return 'text-yellow-500';
        return 'text-rose-500';
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

    const scatterData = [
        ...valuation.comparables.map((comp: any) => ({
            x: Number(comp.sold_price),
            y: 1,
            id: comp.id
        })),
        { x: property.price, y: 1, isProperty: true }
    ];

    const supplyScatterData = [
        ...(valuation.currentSupply || []).map((listing: any) => ({
            x: Number(listing.price),
            y: 1,
            id: listing.id
        })),
        { x: property.price, y: 1, isProperty: true }
    ];

    const medianPrice = valuation.medianComparablePrice || 0;
    const medianSupplyPrice = valuation.medianSupplyPrice || 0;

    const chartMaxComp = Math.max(medianPrice, property.price, ...((valuation.comparables || []).map((c: any) => Number(c.sold_price || 0))));
    const chartMaxSupply = Math.max(medianSupplyPrice, property.price, ...((valuation.currentSupply || []).map((s: any) => Number(s.price || 0))));

    const leadBudgets = matchingLeads.map(l => Number(l.budget_max || 0)).filter(b => b > 0).sort((a, b) => a - b);
    const minBudget = leadBudgets[0] || 0;
    const maxBudget = leadBudgets[leadBudgets.length - 1] || 0;
    const medianBudget = leadBudgets.length > 0
        ? (leadBudgets.length % 2 === 0
            ? (leadBudgets[leadBudgets.length / 2 - 1] + leadBudgets[leadBudgets.length / 2]) / 2
            : leadBudgets[Math.floor(leadBudgets.length / 2)])
        : 0;
    const budgetScatterData = [
        ...matchingLeads.map(l => ({
            x: Number(l.budget_max || 0),
            y: 1,
            name: l.name || 'Partner Lead'
        })),
        { x: property.price, y: 1, isProperty: true }
    ];

    const chartMaxLead = Math.max(maxBudget, property.price);

    // Sales Velocity Logic
    const velBaseline = valuation?.medianComparablePrice || property.price || 1;
    const currentDOM = Math.round(90 * Math.pow(adjustedPrice / velBaseline, 4));

    const velocityChartData = [];
    if (velBaseline > 0) {
        for (let i = 0.7; i <= 1.3; i += 0.05) {
            const p = velBaseline * i;
            const d = Math.round(90 * Math.pow(i, 4));
            velocityChartData.push({
                price: p,
                days: d,
            });
        }
    }

    const handlePriceChange = (newPrice: number) => {
        setIsCalculating(true);
        setAdjustedPrice(newPrice);
        setLastAdjustmentSource('price');
        setTimeout(() => setIsCalculating(false), 600);
    };

    const handleTimelineChange = (newDays: number) => {
        setIsCalculating(true);
        setTargetDays(newDays);
        const suggestedP = velBaseline * Math.pow(newDays / 90, 0.25);
        setAdjustedPrice(suggestedP);
        setLastAdjustmentSource('days');
        setTimeout(() => setIsCalculating(false), 600);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden my-8 scroll-mt-24 relative" id="valuation">
            {/* Header */}
            <div className="bg-gray-50 p-6 flex justify-between items-center text-slate-900 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl tracking-tight text-slate-900">Smart Valuation Engine</h3>
                        <div className="flex items-center gap-2">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lifestyle-Adjusted Market Estimate</p>
                        </div>
                    </div>
                </div>

                {/* Demo Control */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-full">
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black ml-2 mr-1">View As:</span>
                    <button type="button" onClick={() => setUserPlan('free')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'free' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Guest</button>
                    <button type="button" onClick={() => setUserPlan('paid')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${userPlan === 'paid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Pro</button>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        {/* Estimated Value Card */}
                        <div className="bg-indigo-600 p-6 rounded-2xl border border-indigo-500 shadow-xl shadow-indigo-500/10 flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
                            <div className="relative z-10">
                                <p className="text-[10px] text-indigo-100 font-black uppercase tracking-[0.2em] mb-2">
                                    <Target className="w-4 h-4 inline-block mr-2" />
                                    Estimated Value
                                </p>
                                <p className="text-4xl font-black text-white">{formatPrice(valuation.estimatedValue)}</p>
                                <div className="flex items-center gap-2 mt-4 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                                    <div className={`h-2 w-2 rounded-full ${valuation.confidenceScore > 80 ? 'bg-emerald-400' : 'bg-yellow-400'} animate-pulse`}></div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider">{valuation.confidenceScore > 80 ? 'High Confidence' : 'Moderate Confidence'}</span>
                                </div>
                            </div>
                        </div>


                        {/* Listing Price Card */}
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all duration-700" />
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2 relative z-10">Listing Price</p>
                            <p className="text-4xl font-black text-white relative z-10">{formatPrice(property.price)}</p>
                            <div className="flex items-center gap-2 mt-4 relative z-10 bg-slate-800/50 w-fit px-3 py-1 rounded-full border border-slate-700">
                                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Market Price</span>
                            </div>
                        </div>


                        {/* Lifestyle Factors Summary */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-2 grid grid-cols-2 gap-6 items-center">
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors group/item relative">
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                                </div>
                                <div className={`p-3 rounded-full bg-white border border-slate-200 shadow-sm group-hover/item:shadow-emerald-100 group-hover/item:border-emerald-200 transition-all`}>
                                    <Wind className={`w-6 h-6 ${getAqiColor(valuation.lifestyleFactors.aqi.value)}`} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Air Quality</p>
                                    <p className="text-lg font-black text-slate-900 leading-tight">{valuation.lifestyleFactors.aqi.category}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 font-mono">AQI: {valuation.lifestyleFactors.aqi.value}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-orange-200 transition-colors group/item relative">
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                                </div>
                                <div className="p-3 rounded-full bg-white border border-slate-200 shadow-sm group-hover/item:shadow-orange-100 group-hover/item:border-orange-200 transition-all">
                                    <Sun className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">Solar Potential</p>
                                    <p className="text-lg font-black text-slate-900 leading-tight">{valuation.lifestyleFactors.solar.score}/100</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 font-mono">{Math.round(valuation.lifestyleFactors.solar.kwh).toLocaleString()} kWh/yr</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Section 1: Core Analytics Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Market Trend & Estimate */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden relative group transition-all duration-500 hover:border-indigo-500/30">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700" />

                            <div className="mb-6 relative z-10">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                                    Market Trend & Estimate
                                </h2>
                                <p className="text-xs text-slate-400">Comparing neighboring comparable sales against your property's estimated value.</p>
                            </div>
                            <div className="h-[300px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorEstimate" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#475569" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#475569" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                        <XAxis
                                            dataKey={analyticsData ? "date" : "label"}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <YAxis hide={true} />
                                        <Tooltip
                                            cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                            formatter={(value: any) => [formatPrice(value), 'Price']}
                                        />
                                        <Bar dataKey="price" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.type === 'subject' ? 'url(#colorEstimate)' : 'url(#colorComp)'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 text-center mt-4 uppercase tracking-[0.2em] relative z-10">
                                Comparable Sales (Slate) <span className="mx-2 text-slate-700">|</span> Your Estimate (Indigo)
                            </p>
                        </div>

                        {/* Market Price Trends (Remote Change) */}
                        <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm overflow-hidden relative group">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                                        Market PPSM Trends
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Historical PPSM in {property.location_city || 'your area'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-indigo-600">
                                        {formatPrice(valuation.pricePerSqm)}/m²
                                    </div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Average</div>
                                </div>
                            </div>

                            <div className="h-64 mt-4 -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analyticsData?.trends ? [...analyticsData.trends].reverse() : chartData}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey={analyticsData ? "date" : "label"}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #f1f5f9',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                            itemStyle={{ color: '#4f46e5' }}
                                            formatter={(value: any) => [formatPrice(value), 'Price']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey={analyticsData ? "avgPrice" : "price"}
                                            stroke="#4f46e5"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Supply/Demand & Recommendations */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
                        {/* Supply vs Demand Chart */}
                        <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm overflow-hidden relative group col-span-2">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-purple-500" />
                                        Supply vs Demand
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                        Buyer Interest vs Inventory
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Seller's Market</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-64 mt-4 -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={analyticsData?.trends ? [...analyticsData.trends].reverse() : []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #f1f5f9',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Bar dataKey="supply" fill="#a78bfa" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Line type="monotone" dataKey="demand" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recommended Price Change Column */}
                        <div className="space-y-8">
                            {valuation.amenityScore > 0 && (
                                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-6 relative z-10">
                                        <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">Recommended Price Change</h4>
                                            <p className="text-xs text-slate-500">Based on premium features & property score</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Adjustment Suggestion</p>
                                            <p className="text-3xl font-black text-slate-900">+{formatPrice(valuation.amenityScore * 100)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Impact Score</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <span className="text-2xl font-black text-slate-900">{valuation.amenityScore}</span>
                                                <span className="text-xs text-slate-500 font-bold">pts</span>
                                            </div>
                                        </div>
                                    </div>

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

                                    <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center gap-2 text-xs text-emerald-600 font-medium font-mono uppercase tracking-widest">
                                        <Info className="w-3.5 h-3.5" />
                                        <span>Calculation: $100 increase per property point.</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Market Adjustments */}
                    <div className="mt-8">

                        {/* Right Sidebar - Market Adjustments */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 flex items-center gap-2 uppercase tracking-[0.2em] mb-6">
                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                Market Adjustments
                            </h4>

                            {/* Base */}
                            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-indigo-100 transition-colors">
                                <span className="text-sm font-bold text-slate-600">Base Market Value (area ratio)</span>
                                <span className="text-base font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{formatPrice(valuation.baseValue)}</span>
                            </div>

                            {/* AQI Impact */}
                            <div className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50 group hover:border-emerald-200 transition-colors">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Wind className="w-4 h-4 text-emerald-500" />
                                    Air Quality Adjustment
                                </span>
                                <span className={`text-base font-black px-3 py-1 rounded-lg bg-white border border-emerald-100 shadow-sm ${valuation.lifestyleFactors.aqi.impact >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {valuation.lifestyleFactors.aqi.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.aqi.impact * 100).toFixed(1)}%
                                </span>
                            </div>

                            {/* Solar Impact */}
                            <div className="flex justify-between items-center p-4 bg-orange-50/30 rounded-xl border border-orange-100/50 group hover:border-orange-200 transition-colors">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Sun className="w-4 h-4 text-orange-500" />
                                    Solar Potential Bonus
                                </span>
                                <span className="text-base font-black text-orange-600 bg-white px-3 py-1 rounded-lg border border-orange-100 shadow-sm">
                                    {valuation.lifestyleFactors.solar.impact > 0 ? '+' : ''}{(valuation.lifestyleFactors.solar.impact * 100).toFixed(1)}%
                                </span>
                            </div>

                            {/* Offers/Market Interest Impact */}
                            {
                                valuation.lifestyleFactors.offers && (
                                    <div className="flex justify-between items-center p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50 group hover:border-indigo-200 transition-colors">
                                        <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-indigo-500" />
                                            Market Interest Adjustment
                                            {valuation.lifestyleFactors.offers.count > 0 && (
                                                <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                                                    ({valuation.lifestyleFactors.offers.count} offer{valuation.lifestyleFactors.offers.count !== 1 ? 's' : ''})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                <div className="space-y-12">

                    {/* Sales Velocity & Pricing Strategy Section */}
                    <div className="mt-12 pt-12 border-t border-slate-100">
                        <div className="mt-12 overflow-hidden bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative group">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10 p-8 lg:p-12">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                                            <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Predictive Analytics</span>
                                        </div>
                                        <h4 className="font-black text-white text-4xl tracking-tight mb-3">Sales Velocity & Pricing Strategy</h4>
                                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                                            Adjust your target price or timeline to see how it affects the probability and speed of the sale.
                                        </p>
                                    </div>
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 min-w-[280px] shadow-inner text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estimated Time to Sale</p>
                                        <div className={`transition-all duration-500 ${isCalculating ? 'scale-110 blur-[2px] opacity-50' : 'scale-100 opacity-100'}`}>
                                            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500">
                                                {lastAdjustmentSource === 'price' ? currentDOM : targetDays}
                                                <span className="text-xl ml-2 text-slate-500 uppercase">Days</span>
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                                            <Activity className={`w-4 h-4 ${isCalculating ? 'animate-ping' : ''}`} />
                                            <span>ESTIMATION ACTIVE</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                                    {/* Interactive Controls */}
                                    <div className="space-y-10">
                                        {/* Price Slider */}
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Target Sale Price</label>
                                                    <p className="text-3xl font-black text-white">{formatPrice(adjustedPrice)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${adjustedPrice > velBaseline ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                        {adjustedPrice > velBaseline ? 'Above' : 'Below'} Market: {Math.abs(((adjustedPrice / velBaseline) - 1) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min={velBaseline * 0.7}
                                                max={velBaseline * 1.3}
                                                step={1000}
                                                value={adjustedPrice}
                                                onChange={(e) => handlePriceChange(Number(e.target.value))}
                                                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                <span>Fast Sale ({formatPrice(velBaseline * 0.7)})</span>
                                                <span>Max Value ({formatPrice(velBaseline * 1.3)})</span>
                                            </div>
                                        </div>

                                        {/* Timeline Slider */}
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Desired Sale Timeline</label>
                                                    <p className="text-3xl font-black text-white">{lastAdjustmentSource === 'price' ? currentDOM : targetDays} Days</p>
                                                </div>
                                                <div className="text-right">
                                                    <Clock className="w-6 h-6 text-slate-700 animate-pulse" />
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                min={15}
                                                max={365}
                                                step={1}
                                                value={lastAdjustmentSource === 'price' ? currentDOM : targetDays}
                                                onChange={(e) => handleTimelineChange(Number(e.target.value))}
                                                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none"
                                            />
                                            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                <span>Immediate (15 Days)</span>
                                                <span>Patient (1 Year)</span>
                                            </div>
                                        </div>

                                        {/* Summary Insight */}
                                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-6 relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl" />
                                            <p className="text-slate-300 text-sm italic leading-relaxed relative z-10">
                                                "By pricing at <span className="text-white font-bold">{formatPrice(adjustedPrice)}</span>, you are positioning the property
                                                <span className="text-white font-bold"> {Math.abs(((adjustedPrice / velBaseline) - 1) * 100).toFixed(1)}% {adjustedPrice > velBaseline ? 'above' : 'below'} </span>
                                                the current market equilibrium. In this segment, comparable properties generally take
                                                <span className="text-white font-bold text-lg"> {lastAdjustmentSource === 'price' ? currentDOM : targetDays} days </span> to secure a binding offer."
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chart Visualization */}
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-8 shadow-inner h-[420px] relative overflow-hidden">
                                        <div className="absolute top-4 left-6 z-20">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Price vs. Time Curve</p>
                                            <p className="text-xs text-slate-400">Diminishing returns as price increases</p>
                                        </div>

                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={velocityChartData} margin={{ top: 60, right: 20, left: 10, bottom: 20 }}>
                                                <defs>
                                                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                <XAxis
                                                    dataKey="price"
                                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                                    stroke="#475569"
                                                    fontSize={10}
                                                    tick={true}
                                                />
                                                <YAxis
                                                    stroke="#475569"
                                                    fontSize={10}
                                                    tickFormatter={(val) => `${val}d`}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl">
                                                                    <p className="text-indigo-400 font-black text-sm">{formatPrice(payload[0].payload.price)}</p>
                                                                    <p className="text-slate-400 text-xs font-bold">{payload[0].payload.days} Estimated Days</p>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="days"
                                                    stroke="#6366f1"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#velocityGradient)"
                                                    animationDuration={2000}
                                                />
                                                <ReferenceLine
                                                    x={adjustedPrice}
                                                    stroke="#10b981"
                                                    strokeWidth={3}
                                                    strokeDasharray="5 5"
                                                />
                                                <ReferenceLine
                                                    y={lastAdjustmentSource === 'price' ? currentDOM : targetDays}
                                                    strokeWidth={1}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div >

                        {/* Dedicated Market Comparison Section */}
                        <div className="mt-12 pt-12 border-t border-slate-100">
                            <div className="mb-10">
                                <h4 className="font-black text-slate-900 text-3xl tracking-tight mb-2">Market Comparison</h4>
                                <p className="text-sm font-medium text-slate-500">Side-by-side analysis of recently sold properties vs. current active competition.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Recent Comparables Card */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden relative group transition-all duration-500 hover:border-indigo-500/30">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-all duration-700" />

                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <div>
                                            <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                                <Home className="w-5 h-5 text-indigo-400" />
                                                Recent Comparables
                                            </h4>
                                            <p className="text-xs text-slate-400">Analysis of nearby properties sold recently.</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                                            MEDIAN: {formatPrice(medianPrice)}
                                        </div>
                                    </div>

                                    {/* Price Distribution Graphic */}
                                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-6 mb-6 shadow-inner relative z-10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-50" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">Sold Market Positioning</p>
                                        <div className="h-20 w-full relative z-10">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
                                                    <XAxis
                                                        type="number"
                                                        dataKey="x"
                                                        hide={true}
                                                        domain={[0, chartMaxComp * 1.1]}
                                                    />
                                                    <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                                    <ZAxis type="number" range={[120, 120]} />
                                                    <Tooltip
                                                        cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const isProp = payload[0].payload.isProperty;
                                                                return (
                                                                    <div className={`p-2 border shadow-2xl rounded-lg text-xs font-bold ${isProp ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-[#0f172a] border-[#1e293b] text-white'}`}>
                                                                        {isProp && <div className="text-[10px] uppercase mb-1">This Property</div>}
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
                                                        strokeWidth={3}
                                                        strokeDasharray="4 4"
                                                    />
                                                    <ReferenceLine
                                                        x={property.price}
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                    />
                                                    <Scatter
                                                        data={scatterData}
                                                        shape={(props: any) => {
                                                            const { cx, cy, payload } = props;
                                                            if (payload.isProperty) {
                                                                return <path d={`M${cx},${cy - 8} L${cx + 8},${cy} L${cx},${cy + 8} L${cx - 8},${cy} Z`} fill="#10b981" stroke="#fff" strokeWidth={2} />;
                                                            }
                                                            return <circle cx={cx} cy={cy} r={6} fill="#64748b" />;
                                                        }}
                                                        isAnimationActive={true}
                                                        animationDuration={1500}
                                                        animationEasing="ease-out"
                                                    />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-x-0 bottom-2 h-0.5 bg-slate-800 rounded-full mx-8"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-600 mt-2 px-4 relative z-10 tracking-widest">
                                            <span>Below Market</span>
                                            <span>Above Market</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                        {valuation.comparables.map((comp: any) => (
                                            <div key={comp.id} className="flex flex-col p-4 bg-slate-950/30 border border-slate-800/50 rounded-xl hover:border-indigo-500/40 hover:bg-slate-800/40 transition-all duration-300 group/item">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="font-bold text-white group-hover/item:text-indigo-400 transition-colors">{formatPrice(Number(comp.sold_price))}</span>
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{new Date(comp.sold_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-slate-400 text-xs truncate mb-2">
                                                    {comp.properties?.address || 'Address hidden'}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                                        <Building className="w-3 h-3" /> {comp.properties?.rooms} ROOMS
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                                        <Layers className="w-3 h-3" /> {comp.properties?.area_usable} M²
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {valuation.comparables.length === 0 && (
                                            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                                                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold opacity-50 italic">No direct comparables found nearby.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Current Supply Card */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden relative group transition-all duration-500 hover:border-emerald-500/30">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />

                                    <div className="flex justify-between items-center mb-6 relative z-10">
                                        <div>
                                            <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                                <List className="w-5 h-5 text-emerald-400" />
                                                Current Supply
                                            </h4>
                                            <p className="text-xs text-slate-400">Analysis of active listings competing with you.</p>
                                        </div>
                                        <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                                            MEDIAN: {formatPrice(medianSupplyPrice)}
                                        </div>
                                    </div>

                                    {/* Price Distribution Graphic */}
                                    <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-6 mb-6 shadow-inner relative z-10 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 opacity-50" />
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 relative z-10">Active Competition Positioning</p>
                                        <div className="h-20 w-full relative z-10">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 0 }}>
                                                    <XAxis
                                                        type="number"
                                                        dataKey="x"
                                                        hide={true}
                                                        domain={[0, chartMaxSupply * 1.1]}
                                                    />
                                                    <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                                    <ZAxis type="number" range={[120, 120]} />
                                                    <Tooltip
                                                        cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const isProp = payload[0].payload.isProperty;
                                                                return (
                                                                    <div className={`p-2 border shadow-2xl rounded-lg text-xs font-bold ${isProp ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#0f172a] border-[#1e293b] text-white'}`}>
                                                                        {isProp && <div className="text-[10px] uppercase mb-1">This Property</div>}
                                                                        {formatPrice(payload[0].value as number)}
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <ReferenceLine
                                                        x={medianSupplyPrice}
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        strokeDasharray="4 4"
                                                    />
                                                    <ReferenceLine
                                                        x={property.price}
                                                        stroke="#6366f1"
                                                        strokeWidth={3}
                                                    />
                                                    <Scatter
                                                        data={supplyScatterData}
                                                        shape={(props: any) => {
                                                            const { cx, cy, payload } = props;
                                                            if (payload.isProperty) {
                                                                return <path d={`M${cx},${cy - 8} L${cx + 8},${cy} L${cx},${cy + 8} L${cx - 8},${cy} Z`} fill="#6366f1" stroke="#fff" strokeWidth={2} />;
                                                            }
                                                            return <circle cx={cx} cy={cy} r={6} fill="#64748b" />;
                                                        }}
                                                        isAnimationActive={true}
                                                        animationDuration={1500}
                                                        animationEasing="ease-out"
                                                    />
                                                </ScatterChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-x-0 bottom-2 h-0.5 bg-slate-800 rounded-full mx-8"></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black text-slate-600 mt-2 px-4 relative z-10 tracking-widest">
                                            <span>Below Market</span>
                                            <span>Above Market</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                        {(valuation.currentSupply || []).map((listing: any) => (
                                            <div key={listing.id} className="flex flex-col p-4 bg-slate-950/30 border border-slate-800/50 rounded-xl hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all duration-300 group/item">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="font-bold text-white group-hover/item:text-emerald-400 transition-colors">{formatPrice(listing.price)}</span>
                                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{listing.type}</span>
                                                </div>
                                                <div className="text-slate-400 text-xs truncate mb-2">
                                                    {listing.address || 'Address hidden'}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                                        <Building className="w-3 h-3" /> {listing.rooms} ROOMS
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">
                                                        <Layers className="w-3 h-3" /> {listing.area_usable} M²
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(valuation.currentSupply || []).length === 0 && (
                                            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                                                <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-bold opacity-50 italic">No active listings nearby.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>


                            {/* Potential Buyers Card */}
                            <div className="mt-12 pt-12 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-4">
                                        <Activity className="w-8 h-8 text-orange-500 animate-pulse" />
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-slate-900 text-3xl tracking-tight">Potential Buyers</h4>
                                                <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-indigo-500/20 uppercase tracking-widest">
                                                    {matchingLeads.length} AI MATCHES
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500">Precision-matched leads active in your local market area.</p>
                                        </div>
                                    </div>

                                    {matchingLeads.length > 0 && (
                                        <div className="text-right bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">HIGHEST BUDGET</span>
                                            <span className="text-3xl font-black text-emerald-600 tabular-nums">
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
                                ) : (
                                    <>
                                        <div className="space-y-8">
                                            {/* Budget Distribution Graphic */}
                                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 relative group overflow-hidden shadow-xl">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-700" />

                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">BUYER BUDGET DISTRIBUTION</p>
                                                        <p className="text-xs text-slate-400 font-medium">Visualizing lead concentration across price points</p>
                                                    </div>
                                                    <div className="flex gap-6">
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">MIN</span>
                                                            <p className="text-xs font-black text-white">{formatPrice(minBudget)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">MEDIAN</span>
                                                            <p className="text-xs font-black text-indigo-400">{formatPrice(medianBudget)}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">MAX</span>
                                                            <p className="text-xs font-black text-white">{formatPrice(maxBudget)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="h-24 w-full relative z-10">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <ScatterChart margin={{ top: 20, right: 40, left: 40, bottom: 0 }}>
                                                            <XAxis
                                                                type="number"
                                                                dataKey="x"
                                                                hide={true}
                                                                domain={[0, chartMaxLead * 1.1]}
                                                            />
                                                            <YAxis type="number" dataKey="y" hide={true} domain={[0, 2]} />
                                                            <ZAxis type="number" range={[120, 120]} />
                                                            <Tooltip
                                                                cursor={{ strokeDasharray: '3 3', stroke: '#1e293b' }}
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        const isProp = payload[0].payload.isProperty;
                                                                        return (
                                                                            <div className={`p-2 border shadow-2xl rounded-lg text-xs font-bold ${isProp ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-[#0f172a] border-[#1e293b] text-white'}`}>
                                                                                {isProp && <div className="text-[10px] uppercase mb-1">This Property</div>}
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
                                                                strokeDasharray="4 4"
                                                            />
                                                            <ReferenceLine
                                                                x={property.price}
                                                                stroke="#10b981"
                                                                strokeWidth={2}
                                                            />
                                                            <Scatter
                                                                data={budgetScatterData}
                                                                shape={(props: any) => {
                                                                    const { cx, cy, payload } = props;
                                                                    if (payload.isProperty) {
                                                                        return <path d={`M${cx},${cy - 8} L${cx + 8},${cy} L${cx},${cy + 8} L${cx - 8},${cy} Z`} fill="#10b981" stroke="#fff" strokeWidth={2} />;
                                                                    }
                                                                    return <circle cx={cx} cy={cy} r={5} fill="#6366f1" opacity={0.7} />;
                                                                }}
                                                                isAnimationActive={true}
                                                                animationDuration={1500}
                                                            />
                                                        </ScatterChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-x-0 bottom-2 h-0.5 bg-slate-800 rounded-full mx-10"></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black text-slate-600 mt-2 px-6 relative z-10 tracking-[0.2em]">
                                                    <span>LOWER PRICE</span>
                                                    <span>HIGHER PRICE</span>
                                                </div>
                                            </div>


                                            {/* Lead List */}
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                <div
                                                    className="bg-slate-50 px-8 py-4 flex justify-between items-center cursor-pointer group hover:bg-slate-100/80 transition-colors"
                                                    onClick={() => setIsTableExpanded(!isTableExpanded)}
                                                >
                                                    <div className="grid grid-cols-[1.5fr_1fr_1.2fr_1.5fr_40px] gap-4 w-full items-center">
                                                        <div className="flex items-center gap-2 pl-2">
                                                            <div className="text-base font-bold text-indigo-600 animate-pulse">Check Potential Buyers</div>
                                                            <div className="bg-indigo-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                                {matchingLeads.length}
                                                            </div>
                                                        </div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">MATCH SCORE</div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">BUDGET</div>
                                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">URGENCY</div>
                                                        <div className="flex items-center gap-2 justify-end pr-2">
                                                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-2 animate-bounce cursor-pointer">
                                                                {isTableExpanded ? 'HIDE LIST' : 'SHOW LIST'}
                                                                {isTableExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {isTableExpanded && (
                                                    <div className="overflow-x-auto border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                                        <div className="min-w-[700px]">
                                                            <div className="divide-y divide-slate-100">
                                                                {matchingLeads.map((lead: any, index: number) => (
                                                                    <Fragment key={lead.id}>
                                                                        <div
                                                                            onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                                                                            className={`cursor-pointer transition-all grid grid-cols-[1.5fr_1fr_1.2fr_1.5fr_40px] gap-4 items-center px-8 py-7 border-b border-slate-50 last:border-none ${expandedLeadId === lead.id ? 'bg-indigo-50/20' : 'hover:bg-slate-50'}`}
                                                                        >
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black shadow-sm">
                                                                                    B
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-slate-900 text-base">Buyer #{index + 1}</div>
                                                                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                                                                        {lead.preference_type || 'APARTMENT'}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <div className="inline-block px-3 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-black">
                                                                                    {lead.match_score || 100} pts
                                                                                </div>
                                                                            </div>
                                                                            <div className="font-extrabold text-slate-900 text-center text-lg">
                                                                                {formatPrice(lead.budget_max || 0)}
                                                                            </div>
                                                                            <div className="text-center">
                                                                                <span className="text-xs font-medium text-slate-500">{lead.move_urgency || '1-3 months (Moderate)'}</span>
                                                                            </div>
                                                                            <div className="text-right flex justify-end">
                                                                                {expandedLeadId === lead.id ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

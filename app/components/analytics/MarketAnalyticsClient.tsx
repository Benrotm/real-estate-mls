'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, Activity, Home, MapPin, Calendar, DollarSign,
    Users, Target, Zap, Clock, Calculator, Search, Filter, Tag, BarChart3,
    Building2, Key, Warehouse, Landmark, Briefcase, HelpCircle, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { getMarketAnalyticsData, AnalyticsData } from '@/app/lib/actions/analytics';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const CATEGORY_ICONS = {
    'Apartment': Building2,
    'House': Home,
    'Commercial': Landmark,
    'Industrial': Warehouse,
    'Land': MapPin,
    'Business': Briefcase,
    'Other': HelpCircle
};

// Add commas to numbers
const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(num);

export default function MarketAnalyticsClient({ role, userRole, userId }: { role: string; userRole: string; userId?: string }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    // Filters
    const [timeRange, setTimeRange] = useState<'30d' | '6m' | '1y' | 'all'>('6m');
    const [propertyType, setPropertyType] = useState('All');
    const [category, setCategory] = useState('All');
    const [city, setCity] = useState('');
    const [scope, setScope] = useState<'all' | 'mine'>('all');

    // Tools state
    const [valSize, setValSize] = useState<string>('');
    const [roiRent, setRoiRent] = useState<string>('');
    const [roiPrice, setRoiPrice] = useState<string>('');

    // Real-time animation counts
    const [animatedKpis, setAnimatedKpis] = useState({
        totalSupply: 0, totalDemand: 0, avgPrice: 0, marketTemperature: 0,
        totalSoldListings: 0, avgDaysOnMarket: 0
    });

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            setLoading(true);
            try {
                const result = await getMarketAnalyticsData({ timeRange, propertyType, category, city, scope, userId });
                if (isMounted) {
                    setData(result);
                    // Trigger simple count-up animation
                    let startTimestamp: number | null = null;
                    const duration = 1000;

                    const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

                    const animate = (timestamp: number) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                        const ease = easeOutQuart(progress);

                        setAnimatedKpis({
                            totalSupply: Math.floor(result.kpis.totalSupply * ease),
                            totalDemand: Math.floor(result.kpis.totalDemand * ease),
                            avgPrice: Math.floor(result.kpis.avgPrice * ease),
                            marketTemperature: Math.floor(result.kpis.marketTemperature * ease),
                            totalSoldListings: Math.floor(result.kpis.totalSoldListings * ease),
                            avgDaysOnMarket: Math.floor(result.kpis.avgDaysOnMarket * ease)
                        });

                        if (progress < 1) {
                            window.requestAnimationFrame(animate);
                        } else {
                            setAnimatedKpis({ ...result.kpis });
                        }
                    };
                    window.requestAnimationFrame(animate);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadData();

        return () => { isMounted = false; };
    }, [timeRange, propertyType, category, city, scope, userId]);

    // Derived Tool Calculations
    const quickValuation = useMemo(() => {
        if (!data || !valSize || isNaN(Number(valSize))) return null;
        return Number(valSize) * data.kpis.avgPricePerSqm;
    }, [valSize, data]);

    const roiYield = useMemo(() => {
        if (!roiRent || !roiPrice || isNaN(Number(roiRent)) || isNaN(Number(roiPrice))) return null;
        const annualRent = Number(roiRent) * 12;
        return ((annualRent / Number(roiPrice)) * 100).toFixed(2);
    }, [roiRent, roiPrice]);

    const getMarketStatus = (temp: number) => {
        if (temp > 70) return { label: "Seller's Market", color: "text-red-400", bg: "bg-red-500/10" };
        if (temp < 30) return { label: "Buyer's Market", color: "text-emerald-400", bg: "bg-emerald-500/10" };
        return { label: "Balanced Market", color: "text-amber-400", bg: "bg-amber-500/10" };
    };

    const getCategoryPercentages = (sale: number, rent: number, total: number) => {
        if (total === 0) return { salePercent: 0, rentPercent: 0 };
        return {
            salePercent: (sale / total) * 100,
            rentPercent: (rent / total) * 100
        };
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 md:px-6">

            {/* Header & Filters */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-cyan-400" />
                        Market Dynamics
                    </h1>
                    <p className="text-slate-400 mt-1">Deep analytics on active supply, lead demand, and sales velocity.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10 w-full xl:w-auto">
                    {/* Scope Toggle: My Properties / All Properties */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-1 flex">
                        {[
                            { label: 'All Properties', val: 'all' as const },
                            { label: 'My Properties', val: 'mine' as const }
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setScope(opt.val)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${scope === opt.val ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-1 flex">
                        {[
                            { label: '30 Days', val: '30d' },
                            { label: '6 Months', val: '6m' },
                            { label: '1 Year', val: '1y' },
                            { label: 'All Time', val: 'all' }
                        ].map(opt => (
                            <button
                                key={opt.val}
                                onClick={() => setTimeRange(opt.val as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === opt.val ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <select
                        value={propertyType}
                        onChange={e => setPropertyType(e.target.value)}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="All">All Types</option>
                        <option value="Apartment">Apartments</option>
                        <option value="House">Houses</option>
                        <option value="Land">Land</option>
                        <option value="Commercial">Commercial</option>
                    </select>

                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="All">All Categories</option>
                        <option value="Sale">Sale</option>
                        <option value="Rent">Rent</option>
                    </select>

                    <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="City Filter (e.g. Timisoara)"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="bg-slate-950/50 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-cyan-500 w-48"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                /* Enhanced loading animated screen */
                <div className="h-96 flex flex-col items-center justify-center space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />
                    
                    {/* Glowing nested spinner */}
                    <div className="relative w-16 h-16">
                        <div className="w-16 h-16 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin" />
                        <div className="absolute inset-2 w-12 h-12 border-4 border-purple-500/10 border-b-purple-400 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                    </div>

                    <div className="text-center relative z-10">
                        <p className="text-cyan-400 font-extrabold tracking-widest text-sm animate-pulse uppercase">
                            Crunching Full Database
                        </p>
                        <p className="text-slate-400 text-xs mt-2.5 max-w-sm mx-auto leading-relaxed">
                            Compiling active inventory, calculating prices per square meter, building neighborhood matrices, and plotting forecasting trends...
                        </p>
                    </div>
                </div>
            ) : data ? (
                <>
                    {/* Top Row Overview Cards - Adaptations from Picture 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Current Search */}
                        <div className="bg-gradient-to-br from-cyan-900/30 via-slate-900 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all duration-300 pointer-events-none" />
                            <div className="flex items-center justify-between text-cyan-400">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 px-3.5 py-1 rounded-full border border-cyan-500/20">Current Search</span>
                                <Search className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-5xl font-mono font-black text-white mt-4 leading-none">
                                    {formatNum(animatedKpis.totalSupply)}
                                </div>
                                <p className="text-[10px] font-extrabold text-slate-400 mt-2.5 uppercase tracking-wider">Properties matching active filters</p>
                            </div>
                        </div>

                        {/* For Sale */}
                        <div className="bg-gradient-to-br from-emerald-900/30 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300 pointer-events-none" />
                            <div className="flex items-center justify-between text-emerald-400">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20 font-mono">For Sale</span>
                                <Building2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-5xl font-mono font-black text-white mt-4 leading-none">
                                    {formatNum(data.transactionStats.sale.count)}
                                </div>
                                <p className="text-[10px] font-extrabold text-slate-400 mt-2.5 uppercase tracking-wider">Total active listings for sale</p>
                            </div>
                        </div>

                        {/* For Rent */}
                        <div className="bg-gradient-to-br from-purple-900/30 via-slate-900 to-slate-900 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-300 pointer-events-none" />
                            <div className="flex items-center justify-between text-purple-400">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-purple-500/10 px-3.5 py-1 rounded-full border border-purple-500/20 font-mono">For Rent</span>
                                <Key className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-5xl font-mono font-black text-white mt-4 leading-none">
                                    {formatNum(data.transactionStats.rent.count)}
                                </div>
                                <p className="text-[10px] font-extrabold text-slate-400 mt-2.5 uppercase tracking-wider">Total active listings for rent</p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Category Cards Grid - adapted from Picture 2 */}
                    <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2 flex justify-between items-end">
                            <div>
                                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">Inventory Distribution by Category</h3>
                                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Category-specific active volume status and transaction splits</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                            {Object.entries(data.categoryStats).map(([type, stats]) => {
                                const Icon = CATEGORY_ICONS[type as keyof typeof CATEGORY_ICONS] || HelpCircle;
                                const { salePercent, rentPercent } = getCategoryPercentages(stats.sale, stats.rent, stats.total);

                                return (
                                    <div key={type} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 hover:-translate-y-1 transition-all duration-300 shadow-md">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                        
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-9 h-9 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-all duration-300">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-black bg-slate-950 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800/60 font-mono shadow-sm group-hover:text-cyan-400 group-hover:border-cyan-500/20 transition-all duration-300">
                                                    {stats.total}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-xs font-black text-slate-200 mb-3 truncate group-hover:text-white transition-colors duration-300">{type}</h4>
                                            
                                            <div className="space-y-1 text-[10px]">
                                                <div className="flex justify-between items-center py-1 border-b border-slate-950/40">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                        For Sale
                                                    </span>
                                                    <span className="text-white font-black font-mono">{stats.sale}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="flex items-center gap-1.5 font-bold text-slate-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                        For Rent
                                                    </span>
                                                    <span className="text-white font-black font-mono">{stats.rent}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800/50 p-[0.5px]">
                                                {stats.total > 0 ? (
                                                    <>
                                                        {stats.sale > 0 && (
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-l-full transition-all" 
                                                                style={{ width: `${salePercent}%` }}
                                                            />
                                                        )}
                                                        {stats.rent > 0 && (
                                                            <div 
                                                                className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-r-full transition-all" 
                                                                style={{ width: `${rentPercent}%` }}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full bg-slate-950 rounded-full" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* KPI row - compact, 6 key dashboard items */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* KPI 1: Supply */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center">
                                    <Home className="w-4 h-4 text-cyan-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Active Supply</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{formatNum(animatedKpis.totalSupply)}</h3>
                        </div>

                        {/* KPI 2: Demand */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Users className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Lead Demand</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{formatNum(animatedKpis.totalDemand)}</h3>
                        </div>

                        {/* KPI 3: Sold Listings */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-rose-500/30 transition-all">
                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center">
                                    <Tag className="w-4 h-4 text-rose-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Sold Listings</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{formatNum(animatedKpis.totalSoldListings)}</h3>
                        </div>

                        {/* KPI 4: Avg Price */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Avg Price</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">€{formatNum(animatedKpis.avgPrice)}</h3>
                            <p className="text-[10px] text-slate-500 mt-1">€{formatNum(data.kpis.avgPricePerSqm)}/m²</p>
                        </div>

                        {/* KPI 5: Avg Days on Market */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Days on Market</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{animatedKpis.avgDaysOnMarket} <span className="text-xs text-slate-500 font-normal">days</span></h3>
                        </div>

                        {/* KPI 6: Market Temp */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-600 transition-all">
                            <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full blur-xl transition-all ${getMarketStatus(data.kpis.marketTemperature).bg.replace('10', '20')}`} />
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-9 h-9 border rounded-lg flex items-center justify-center ${getMarketStatus(data.kpis.marketTemperature).bg} ${getMarketStatus(data.kpis.marketTemperature).color.replace('text', 'border')}/30`}>
                                    <Activity className={`w-4 h-4 ${getMarketStatus(data.kpis.marketTemperature).color}`} />
                                </div>
                                <p className="text-slate-400 text-xs font-medium">Market Temp</p>
                            </div>
                            <h3 className="text-2xl font-bold text-white">{animatedKpis.marketTemperature}<span className="text-xs text-slate-500 font-normal">/100</span></h3>
                            <p className={`text-[10px] font-semibold mt-1 ${getMarketStatus(data.kpis.marketTemperature).color}`}>{getMarketStatus(data.kpis.marketTemperature).label}</p>
                        </div>
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Supply vs Demand Dynamics (Line/Bar Composed) */}
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                        Supply vs Demand Dynamics
                                    </h2>
                                    <p className="text-xs text-slate-400">Comparing active listings (bars) against incoming leads (line).</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={[...data.trends].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="left" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fill: '#8b5cf6', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar yAxisId="left" dataKey="supply" name="New Supply (Listings)" fill="url(#colorSupply)" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Line yAxisId="right" type="monotone" dataKey="demand" name="Demand Volume (Leads)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, stroke: '#c4b5fd' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Demand Heatmap (Horizontal Bar) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <Target className="w-5 h-5 text-red-400" />
                                Demand Heatmap (Top Cities)
                            </h2>
                            <p className="text-xs text-slate-400 mb-6">Locations generating the most leads.</p>

                            <div className="h-[260px] w-full">
                                {data.heatMap.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.heatMap} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                            <XAxis type="number" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis dataKey="name" type="category" stroke="#e2e8f0" tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} />
                                            <Bar dataKey="leads" name="Active Leads" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                                                {data.heatMap.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">No significant demand data.</div>
                                )}
                            </div>
                        </div>

                        {/* Price Trends (Area Chart) */}
                        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                Market Price Trends
                            </h2>
                            <p className="text-xs text-slate-400 mb-6">Average sold/listing prices over time.</p>

                            <div className="h-[260px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[...data.trends].reverse()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `€${formatNum(value)}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                                            formatter={(value: any) => [`€${formatNum(Number(value || 0))}`, 'Avg Price']}
                                        />
                                        <Area type="monotone" dataKey="avgPrice" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Supply Distribution (Animated Doughnut) */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center relative">
                            <h2 className="text-lg font-bold text-white mb-1 self-start w-full">Inventory Breakdown</h2>
                            <p className="text-xs text-slate-400 mb-2 self-start w-full">Distribution by property type</p>

                            <div className="h-[220px] w-full relative">
                                {data.distribution.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <defs>
                                                    {COLORS.map((color, i) => (
                                                        <linearGradient key={`pie-grad-${i}`} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                                                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                                                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <Pie
                                                    data={data.distribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={88}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    stroke="none"
                                                    isAnimationActive={true}
                                                    animationBegin={200}
                                                    animationDuration={1200}
                                                    animationEasing="ease-out"
                                                    label={({ cx, cy, midAngle, innerRadius: ir, outerRadius: or, percent }: any) => {
                                                        if (percent < 0.05) return null;
                                                        const RADIAN = Math.PI / 180;
                                                        const radius = ir + (or - ir) * 0.5;
                                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                        return (
                                                            <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
                                                                {`${(percent * 100).toFixed(0)}%`}
                                                            </text>
                                                        );
                                                    }}
                                                    labelLine={false}
                                                >
                                                    {data.distribution.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={`url(#pieGrad${index % COLORS.length})`}
                                                            style={{ filter: 'drop-shadow(0 0 6px ' + COLORS[index % COLORS.length] + '40)' }}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-2xl font-bold text-white">{data.kpis.totalSupply}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Total</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">No inventory data.</div>
                                )}
                            </div>

                            {/* Custom Legend */}
                            <div className="flex flex-wrap justify-center gap-3 mt-2 w-full">
                                {data.distribution.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-300">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed pricing and square meter breakdowns */}
                    <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-emerald-400" />
                                Market Pricing & Square Meter Breakdowns
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">Average prices, usable space metrics, and €/m² breakdowns across different database divisions</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Card 1: Property Types pricing */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-cyan-400" />
                                    Pricing by Property Type
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-slate-300">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-extrabold tracking-wider">
                                                <th className="py-2.5">Category</th>
                                                <th className="py-2.5 text-right">Avg Price</th>
                                                <th className="py-2.5 text-right">Avg Price / m²</th>
                                                <th className="py-2.5 text-right font-mono">Listings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 text-xs">
                                            {Object.entries(data.categoryStats).map(([name, stats]) => (
                                                <tr key={name} className="hover:bg-slate-800/20 transition-colors">
                                                    <td className="py-2.5 font-semibold text-white">{name}</td>
                                                    <td className="py-2.5 text-right">€{formatNum(stats.avgPrice)}</td>
                                                    <td className="py-2.5 text-right text-emerald-400 font-bold">€{formatNum(stats.avgPricePerSqm)}/m²</td>
                                                    <td className="py-2.5 text-right font-mono text-slate-400">{stats.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Card 2: Apartments by Room counts */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-purple-400" />
                                    Apartments Room Count Breakdown
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-slate-300">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-extrabold tracking-wider">
                                                <th className="py-2.5">Layout</th>
                                                <th className="py-2.5 text-right">Avg Price</th>
                                                <th className="py-2.5 text-right">Avg Price / m²</th>
                                                <th className="py-2.5 text-right font-mono">Listings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40 text-xs">
                                            {data.roomStats.map((stat) => (
                                                <tr key={stat.rooms} className="hover:bg-slate-800/20 transition-colors">
                                                    <td className="py-2.5 font-semibold text-white">{stat.rooms}</td>
                                                    <td className="py-2.5 text-right">€{formatNum(stat.avgPrice)}</td>
                                                    <td className="py-2.5 text-right text-cyan-400 font-bold">€{formatNum(stat.avgPricePerSqm)}/m²</td>
                                                    <td className="py-2.5 text-right font-mono text-slate-400">{stat.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Card 3: Top Cities */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-cyan-400" />
                                    Pricing by Location (Top Cities)
                                </h4>
                                <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
                                    {data.cityStats.length > 0 ? (
                                        <table className="w-full text-left border-collapse text-slate-300">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-extrabold tracking-wider sticky top-0 bg-slate-900 z-10">
                                                    <th className="py-2 bg-slate-900">City</th>
                                                    <th className="py-2 text-right bg-slate-900">Avg Price</th>
                                                    <th className="py-2 text-right bg-slate-900">Avg Price / m²</th>
                                                    <th className="py-2 text-right bg-slate-900 font-mono">Listings</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                                {data.cityStats.map((stat) => (
                                                    <tr key={stat.name} className="hover:bg-slate-800/20 transition-colors">
                                                        <td className="py-2.5 font-semibold text-white">{stat.name}</td>
                                                        <td className="py-2.5 text-right">€{formatNum(stat.avgPrice)}</td>
                                                        <td className="py-2.5 text-right text-emerald-400 font-bold">€{formatNum(stat.avgPricePerSqm)}/m²</td>
                                                        <td className="py-2.5 text-right font-mono text-slate-400">{stat.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-slate-500 text-xs text-center py-6">No city location data in database.</div>
                                    )}
                                </div>
                            </div>

                            {/* Card 4: Top Neighborhood Areas */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-amber-400" />
                                    Pricing by Location (Top Areas)
                                </h4>
                                <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
                                    {data.areaStats.length > 0 ? (
                                        <table className="w-full text-left border-collapse text-slate-300">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[9px] uppercase text-slate-500 font-extrabold tracking-wider sticky top-0 bg-slate-900 z-10">
                                                    <th className="py-2 bg-slate-900">Area</th>
                                                    <th className="py-2 text-right bg-slate-900">Avg Price</th>
                                                    <th className="py-2 text-right bg-slate-900">Avg Price / m²</th>
                                                    <th className="py-2 text-right bg-slate-900 font-mono">Listings</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40 text-xs">
                                                {data.areaStats.map((stat) => (
                                                    <tr key={stat.name} className="hover:bg-slate-800/20 transition-colors">
                                                        <td className="py-2.5 font-semibold text-white">{stat.name}</td>
                                                        <td className="py-2.5 text-right">€{formatNum(stat.avgPrice)}</td>
                                                        <td className="py-2.5 text-right text-amber-400 font-bold">€{formatNum(stat.avgPricePerSqm)}/m²</td>
                                                        <td className="py-2.5 text-right font-mono text-slate-400">{stat.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-slate-500 text-xs text-center py-6 font-medium">No area neighborhood data. Select a city or clear filters to see area splits.</div>
                                    )}
                                </div>
                            </div>

                            {/* Card 5: Price Ranges */}
                            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full pointer-events-none" />
                                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-rose-400" />
                                    Pricing by Price Ranges
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">For Sale Ranges</h5>
                                        <div className="space-y-2">
                                            {data.priceRangeStats.filter(r => r.range.startsWith('Sale:')).map((stat) => (
                                                <div key={stat.range} className="flex justify-between items-center text-xs bg-slate-950/30 p-2.5 border border-slate-800/40 rounded-xl">
                                                    <div>
                                                        <p className="font-semibold text-white">{stat.range.replace('Sale: ', '')}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{stat.count} Listings</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-white">€{formatNum(stat.avgPrice)}</p>
                                                        <p className="text-[10px] text-emerald-400 font-extrabold mt-0.5">€{formatNum(stat.avgPricePerSqm)}/m²</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1">For Rent Ranges</h5>
                                        <div className="space-y-2">
                                            {data.priceRangeStats.filter(r => r.range.startsWith('Rent:')).map((stat) => (
                                                <div key={stat.range} className="flex justify-between items-center text-xs bg-slate-950/30 p-2.5 border border-slate-800/40 rounded-xl">
                                                    <div>
                                                        <p className="font-semibold text-white">{stat.range.replace('Rent: ', '')}</p>
                                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{stat.count} Listings</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-white">€{formatNum(stat.avgPrice)}</p>
                                                        <p className="text-[10px] text-purple-400 font-extrabold mt-0.5">€{formatNum(stat.avgPricePerSqm)}/m²</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Algorithmic price projections / forecasts */}
                    <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-2">
                            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-cyan-400" />
                                12-Month Real Estate Price Forecasts
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">Algorithmic trend extrapolation based on the historical evolution of prices per category</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {Object.entries(data.forecasts).map(([category, forecast]) => {
                                const isUp = forecast.trendDirection === 'up';
                                const isDown = forecast.trendDirection === 'down';
                                
                                return (
                                    <div key={category} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
                                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 ${isUp ? 'bg-emerald-500' : isDown ? 'bg-red-500' : 'bg-amber-500'} pointer-events-none`} />
                                        
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-100 group-hover:text-white transition-colors">{category}</h4>
                                                <span className="text-[9px] font-extrabold bg-slate-950 text-slate-500 border border-slate-800/80 px-2 py-0.5 rounded-full mt-1 inline-block uppercase">
                                                    Confidence: {forecast.confidence}
                                                </span>
                                            </div>
                                            <div className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full border ${isUp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isDown ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : isDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                                {forecast.growthRate > 0 ? '+' : ''}{forecast.growthRate}%
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 border border-slate-850 p-3 rounded-xl mb-4 text-xs">
                                            <div>
                                                <span className="text-[9px] text-slate-500 uppercase font-black block">Current Sqm</span>
                                                <span className="text-xs font-extrabold text-white">€{formatNum(forecast.currentPricePerSqm)}/m²</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-slate-500 uppercase font-black block">Projected (12m)</span>
                                                <span className={`text-xs font-extrabold ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-amber-400'}`}>
                                                    €{formatNum(forecast.projectedPricePerSqm12m)}/m²
                                                </span>
                                            </div>
                                        </div>

                                        {/* Micro Chart */}
                                        <div className="h-[90px] w-full mt-2 relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={forecast.historicalTrend} margin={{ top: 2, right: 2, left: -20, bottom: 2 }}>
                                                    <defs>
                                                        <linearGradient id={`grad-${category}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'} stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor={isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'} stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="date" hide={true} />
                                                    <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide={true} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '10px', padding: '4px 8px' }}
                                                        formatter={(value: any) => [`€${formatNum(Number(value))}/m²`, 'Price/m²']}
                                                        labelStyle={{ display: 'none' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="avgPricePerSqm"
                                                        stroke={isUp ? '#10b981' : isDown ? '#ef4444' : '#f59e0b'}
                                                        strokeWidth={2}
                                                        fillOpacity={1}
                                                        fill={`url(#grad-${category})`}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                            <div className="absolute top-0 bottom-0 left-[50%] border-r border-dashed border-slate-800 pointer-events-none" />
                                            <span className="absolute bottom-0.5 left-1 text-[8px] text-slate-500 tracking-wider uppercase font-black font-mono">Past 6m</span>
                                            <span className="absolute bottom-0.5 right-1 text-[8px] text-slate-500 tracking-wider uppercase font-black font-mono text-right">Future 6m</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tools Row */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Quick Valuation Tool */}
                        <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900 border border-cyan-500/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-cyan-400" />
                                Quick Estimates
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Estimate value based on current averages (Avg: €{formatNum(data.kpis.avgPricePerSqm)}/m²).</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter Area size (m²)"
                                        value={valSize}
                                        onChange={e => setValSize(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">m²</span>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Est. Value:</span>
                                    <span className="text-xl font-bold text-cyan-400">
                                        {quickValuation ? `€${formatNum(Math.round(quickValuation))}` : '---'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ROI Calculator */}
                        <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                Investment ROI
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Calculate estimated gross rental yield.</p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            value={roiPrice}
                                            onChange={e => setRoiPrice(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-8 pr-2 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="Rent/Mo"
                                            value={roiRent}
                                            onChange={e => setRoiRent(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-8 pr-2 py-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                                    </div>
                                </div>

                                <div className="bg-slate-950/50 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Gross Yield:</span>
                                    <span className="text-xl font-bold text-emerald-400">
                                        {roiYield ? `${roiYield}%` : '---'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Feed */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Recent Activity
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar max-h-[175px]">
                                {data.recentActivity.length > 0 ? data.recentActivity.map((activity, i) => (
                                    <div key={`${activity.id}-${i}`} className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${activity.type === 'sale' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-white truncate">{activity.title}</p>
                                            <p className="text-xs text-slate-400">
                                                {activity.type === 'sale' ? 'Sold' : 'Listed'} for <span className="font-semibold text-slate-300">€{formatNum(activity.price)}</span>
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-slate-500 whitespace-nowrap">
                                            {activity.date}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-slate-500 text-center py-6">No recent activity matching filters.</div>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            ) : null}

        </div>
    );
}

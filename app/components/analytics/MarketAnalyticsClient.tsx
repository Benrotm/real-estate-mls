'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart
} from 'recharts';
import {
    TrendingUp, Activity, Home, MapPin, Calendar, DollarSign,
    Users, Target, Zap, Clock, Calculator, Search, Filter, Tag, BarChart3
} from 'lucide-react';
import { getMarketAnalyticsData, AnalyticsData, AnalyticsFilters } from '@/app/lib/actions/analytics';

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
    }, [timeRange, propertyType, category, city, scope]);

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

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

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

            {loading && !data ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-cyan-400 animate-pulse font-medium">Crunching market data...</p>
                </div>
            ) : data ? (
                <>
                    {/* KPI row - compact, all 6 in one row */}
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
                            <h3 className="text-2xl font-bold text-white">{animatedKpis.avgDaysOnMarket} <span className="text-sm text-slate-500 font-normal">days</span></h3>
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
                            <h3 className="text-2xl font-bold text-white">{animatedKpis.marketTemperature}<span className="text-sm text-slate-500 font-normal">/100</span></h3>
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
                            {/* Background graph grid effect */}
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
                                        {/* Center Label */}
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

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
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

                    </div>
                </>
            ) : null}

        </div>
    );
}

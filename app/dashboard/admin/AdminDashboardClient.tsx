'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Users, Home, Target, Coins, Ticket, Wrench, Eye, Shield, BarChart3,
    TrendingUp, TrendingDown, Minus, ArrowRight, Clock, AlertTriangle,
    Settings, CreditCard, MessageSquare, Layers, Compass, Star, Zap,
    MonitorPlay, UserCog, Activity, Building2, ChevronRight, RefreshCw
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import type { DashboardData } from '@/app/lib/actions/admin-dashboard';

interface AdminDashboardClientProps {
    data: DashboardData;
    adminName: string;
    isSuperAdmin: boolean;
}

// ─── HELPER: Percentage change ──────────────────────────────
function pctChange(current: number, previous: number): { value: number; direction: 'up' | 'down' | 'stable' } {
    if (previous === 0 && current === 0) return { value: 0, direction: 'stable' };
    if (previous === 0) return { value: 100, direction: 'up' };
    const pct = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable' };
}

// ─── HELPER: Format number ──────────────────────────────────
function formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('ro-RO');
}

// ─── HELPER: Time ago ───────────────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Acum';
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}z`;
    return `${Math.floor(days / 7)}s`;
}

// ─── KPI CARD COMPONENT ─────────────────────────────────────
function KpiCard({
    title, value, subtitle, trend, accentColor, icon: Icon, link
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: { value: number; direction: 'up' | 'down' | 'stable' };
    accentColor: string;
    icon: any;
    link?: string;
}) {
    const card = (
        <div className={`relative overflow-hidden bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all duration-300 group ${link ? 'cursor-pointer' : ''}`}>
            {/* Accent top border */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${accentColor}`} />
            
            {/* Glow effect */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 ${accentColor} pointer-events-none`} />
            
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white/70" />
                </div>
                {trend && trend.direction !== 'stable' && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        trend.direction === 'up' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-400'
                    }`}>
                        {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend.value}%
                    </div>
                )}
                {trend && trend.direction === 'stable' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400">
                        <Minus className="w-3 h-3" /> Stabil
                    </div>
                )}
            </div>
            
            <div className="text-2xl font-bold text-white tracking-tight">{typeof value === 'number' ? formatNum(value) : value}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{title}</div>
            {subtitle && <div className="text-[10px] text-slate-500 mt-1 font-medium">{subtitle}</div>}
            
            {link && (
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
            )}
        </div>
    );

    if (link) {
        return <Link href={link}>{card}</Link>;
    }
    return card;
}

// ─── CHART TOOLTIP ──────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs">
            <p className="font-bold text-white mb-1.5">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="font-medium">{entry.name}:</span>
                    <span className="font-bold text-white">{entry.value}</span>
                </div>
            ))}
        </div>
    );
}

// ─── QUICK NAV ITEMS ────────────────────────────────────────
const QUICK_NAV = [
    { label: 'Utilizatori', href: '/dashboard/admin/users', icon: Users, color: 'text-blue-400' },
    { label: 'Proprietăți', href: '/dashboard/admin/properties', icon: Home, color: 'text-emerald-400' },
    { label: 'Leads', href: '/dashboard/admin/leads', icon: Target, color: 'text-amber-400' },
    { label: 'Credite', href: '/dashboard/admin/credit-settings', icon: CreditCard, color: 'text-purple-400' },
    { label: 'Validare Plăți', href: '/dashboard/admin/validare-plati', icon: Coins, color: 'text-yellow-400' },
    { label: 'Tickets', href: '/dashboard/admin/tickets', icon: Ticket, color: 'text-rose-400' },
    { label: 'Servicii', href: '/dashboard/admin/services', icon: Wrench, color: 'text-cyan-400' },
    { label: 'Features', href: '/dashboard/admin/features', icon: Zap, color: 'text-orange-400' },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, color: 'text-indigo-400' },
    { label: 'Scoring', href: '/dashboard/admin/scoring', icon: Star, color: 'text-pink-400' },
    { label: 'Tururi 3D', href: '/dashboard/admin/tours', icon: MonitorPlay, color: 'text-teal-400' },
    { label: 'Pipeline', href: '/dashboard/admin/pipeline', icon: Layers, color: 'text-violet-400' },
    { label: 'Contracte', href: '/dashboard/admin/presentation-contracts', icon: Compass, color: 'text-lime-400' },
    { label: 'Chat', href: '/dashboard/admin/chat', icon: MessageSquare, color: 'text-sky-400' },
    { label: 'Setări', href: '/dashboard/admin/settings', icon: Settings, color: 'text-slate-400' },
];

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function AdminDashboardClient({ data, adminName, isSuperAdmin }: AdminDashboardClientProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const userTrend = pctChange(data.users.newThisMonth, data.users.newLastMonth);
    const propTrend = pctChange(data.properties.newThisMonth, data.properties.newLastMonth);
    const leadTrend = pctChange(data.leads.newThisMonth, data.leads.newLastMonth);
    const revTrend = pctChange(data.revenue.thisMonthRon, data.revenue.lastMonthRon);

    return (
        <div className="space-y-8">

            {/* ═══ HEADER ═══ */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        Command Center
                    </h1>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Bun venit, <span className="text-orange-400 font-bold">{adminName}</span> · {currentTime.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/admin/analytics"
                        className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-slate-800 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                    >
                        <BarChart3 className="w-3.5 h-3.5" /> Market Analytics
                    </Link>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Sistem Activ
                    </div>
                </div>
            </header>

            {/* ═══ KPI CARDS ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                <KpiCard
                    title="Utilizatori Total"
                    value={data.users.total}
                    subtitle={`+${data.users.newThisMonth} luna aceasta`}
                    trend={userTrend}
                    accentColor="bg-blue-500"
                    icon={Users}
                    link="/dashboard/admin/users"
                />
                <KpiCard
                    title="Proprietăți Active"
                    value={data.properties.active}
                    subtitle={`${data.properties.draft} draft · ${data.properties.sold} sold`}
                    trend={propTrend}
                    accentColor="bg-emerald-500"
                    icon={Home}
                    link="/dashboard/admin/properties"
                />
                <KpiCard
                    title="Leads Activi"
                    value={data.leads.total}
                    subtitle={`+${data.leads.newThisMonth} luna aceasta`}
                    trend={leadTrend}
                    accentColor="bg-amber-500"
                    icon={Target}
                    link="/dashboard/admin/leads"
                />
                <KpiCard
                    title="Venit Total (RON)"
                    value={`${formatNum(data.revenue.totalApprovedRon)}`}
                    subtitle={`${data.revenue.pendingPayments} plăți în așteptare`}
                    trend={revTrend}
                    accentColor="bg-purple-500"
                    icon={Coins}
                    link="/dashboard/admin/validare-plati"
                />
                <KpiCard
                    title="Tickets Deschise"
                    value={data.tickets.open}
                    subtitle={`${data.tickets.total} total · ${data.tickets.byPriority['high'] || 0} urgente`}
                    accentColor="bg-rose-500"
                    icon={Ticket}
                    link="/dashboard/admin/tickets"
                />
                <KpiCard
                    title="Solicitări Servicii"
                    value={data.services.pendingRequests}
                    subtitle={`${data.services.totalProviders} furnizori · ${data.services.pendingProviders} în așteptare`}
                    accentColor="bg-cyan-500"
                    icon={Wrench}
                    link="/dashboard/admin/services"
                />
            </div>

            {/* ═══ CHARTS ROW ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                
                {/* User & Lead Growth Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-bold text-white">Creștere Platformă</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Utilizatori noi & leads — ultimele 6 luni</p>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Utilizatori</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Leads</span>
                        </div>
                    </div>
                    <div className="h-[220px] md:h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.monthlyGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="users" name="Utilizatori" stroke="#3b82f6" fillOpacity={1} fill="url(#gradUsers)" strokeWidth={2} />
                                <Area type="monotone" dataKey="leads" name="Leads" stroke="#f59e0b" fillOpacity={1} fill="url(#gradLeads)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Properties Chart */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-sm font-bold text-white">Proprietăți Noi</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Listări noi adăugate lunar</p>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Proprietăți</span>
                        </div>
                    </div>
                    <div className="h-[220px] md:h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.monthlyGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="properties" name="Proprietăți" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ═══ ACTIVITY FEED + QUICK NAV ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                
                {/* Activity Feed */}
                <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" /> Activitate Recentă
                        </h3>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Live Feed</span>
                    </div>
                    <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {data.recentActivity.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-lg mt-0.5 shrink-0">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{item.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate font-medium">{item.detail}</p>
                                </div>
                                <span className="text-[9px] text-slate-600 font-bold shrink-0 mt-1">{timeAgo(item.timestamp)}</span>
                            </div>
                        ))}
                        {data.recentActivity.length === 0 && (
                            <div className="text-center text-slate-500 py-8 text-xs">Nu există activitate recentă.</div>
                        )}
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-orange-500" /> Navigare Rapidă
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                        {QUICK_NAV.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-slate-800 transition-all group text-center"
                            >
                                <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                                <span className="text-[9px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider transition-colors leading-tight">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ PLATFORM STATS BAR ═══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white">{formatNum(data.properties.total)}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Proprietăți</div>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white">{data.properties.avgPrice > 0 ? `€${formatNum(data.properties.avgPrice)}` : '—'}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Preț Mediu</div>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white">{formatNum(data.revenue.totalCreditsSold)}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Credite Vândute</div>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white">{data.tours.total}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Tururi Virtuale</div>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-white">{data.services.totalProviders}</div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Furnizori Servicii</div>
                </div>
                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 text-center">
                    <div className="text-lg font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Online
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Status Platformă</div>
                </div>
            </div>

            {/* ═══ USER DISTRIBUTION + LEAD STATUS ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* User Role Distribution */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-blue-400" /> Distribuție Utilizatori per Rol
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(data.users.byRole)
                            .sort(([, a], [, b]) => b - a)
                            .map(([role, count]) => {
                                const pct = data.users.total > 0 ? Math.round((count / data.users.total) * 100) : 0;
                                const roleColors: Record<string, string> = {
                                    owner: 'bg-emerald-500',
                                    client: 'bg-blue-500',
                                    agent: 'bg-amber-500',
                                    developer: 'bg-purple-500',
                                    admin: 'bg-rose-500',
                                    super_admin: 'bg-red-600',
                                };
                                return (
                                    <div key={role} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-300 capitalize">{role.replace('_', ' ')}</span>
                                            <span className="text-slate-500 font-bold">{count} <span className="text-slate-600">({pct}%)</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${roleColors[role] || 'bg-slate-500'} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Lead Status Distribution */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 md:p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400" /> Status Leads
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(data.leads.byStatus)
                            .sort(([, a], [, b]) => b - a)
                            .map(([status, count]) => {
                                const pct = data.leads.total > 0 ? Math.round((count / data.leads.total) * 100) : 0;
                                const statusColors: Record<string, string> = {
                                    new: 'bg-blue-500',
                                    contacted: 'bg-cyan-500',
                                    qualified: 'bg-amber-500',
                                    converted: 'bg-emerald-500',
                                    lost: 'bg-rose-500',
                                    hot: 'bg-orange-500',
                                    warm: 'bg-yellow-500',
                                    cold: 'bg-slate-500',
                                };
                                return (
                                    <div key={status} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-300 capitalize">{status}</span>
                                            <span className="text-slate-500 font-bold">{count} <span className="text-slate-600">({pct}%)</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${statusColors[status] || 'bg-slate-500'} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        {Object.keys(data.leads.byStatus).length === 0 && (
                            <p className="text-xs text-slate-500 text-center py-4">Nu există date despre leads.</p>
                        )}
                    </div>
                </div>
            </div>
            {/* ═══ PENDING APPROVALS ═══ */}
            {(data.pendingApprovals.creditPurchases.length > 0 ||
              data.pendingApprovals.serviceProviders.length > 0 ||
              data.pendingApprovals.portalActivations.length > 0 ||
              data.pendingApprovals.userApprovals.length > 0) && (
                <div className="space-y-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        Necesită Aprobare
                        <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {data.pendingApprovals.creditPurchases.length + data.pendingApprovals.serviceProviders.length + data.pendingApprovals.portalActivations.length + data.pendingApprovals.userApprovals.length} în așteptare
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Credit Purchases Pending */}
                        {data.pendingApprovals.creditPurchases.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Coins className="w-3.5 h-3.5 text-yellow-400" /> Plăți Credite în Așteptare
                                    </h3>
                                    <Link href="/dashboard/admin/validare-plati" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                        Gestionează <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-850">
                                    {data.pendingApprovals.creditPurchases.map((p) => (
                                        <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-white">{p.user_name}</p>
                                                <p className="text-[10px] text-slate-500">{p.user_email} · Ref: {p.reference_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-yellow-400">{p.amount_ron} RON</p>
                                                <p className="text-[10px] text-slate-500">{p.credits} credite</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Service Providers Pending */}
                        {data.pendingApprovals.serviceProviders.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Cereri Parteneriat Furnizori
                                    </h3>
                                    <Link href="/dashboard/admin/services" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                        Gestionează <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-850">
                                    {data.pendingApprovals.serviceProviders.map((sp) => (
                                        <div key={sp.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-white">{sp.brand_name}</p>
                                                <p className="text-[10px] text-slate-500">{sp.city} · {sp.category_slug} · {sp.phone}</p>
                                            </div>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                                sp.selected_plan === 'exclusivity' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                            }`}>{sp.selected_plan}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Portal Activations Pending */}
                        {data.pendingApprovals.portalActivations.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Building2 className="w-3.5 h-3.5 text-purple-400" /> Activări Portal
                                    </h3>
                                    <Link href="/dashboard/admin/portal-activations" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                        Gestionează <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-850">
                                    {data.pendingApprovals.portalActivations.map((pa) => (
                                        <div key={pa.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-white">{pa.user_name}</p>
                                                <p className="text-[10px] text-slate-500">{pa.user_email}</p>
                                            </div>
                                            <span className="text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded-full uppercase">{pa.portal_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* User Approvals Pending */}
                        {data.pendingApprovals.userApprovals.length > 0 && (
                            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5 text-blue-400" /> Utilizatori Neaprobați
                                    </h3>
                                    <Link href="/dashboard/admin/users" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                        Gestionează <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-850">
                                    {data.pendingApprovals.userApprovals.map((u) => (
                                        <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="text-xs font-bold text-white">{u.full_name}</p>
                                                <p className="text-[10px] text-slate-500">{u.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                                                <span className="text-[9px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{u.plan_tier}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ REQUEST QUEUES ═══ */}
            <div className="space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                    Cereri & Solicitări Active
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Service Requests */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Wrench className="w-3.5 h-3.5 text-cyan-400" /> Solicitări Servicii
                                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-1.5 py-0.5 rounded-full">{data.requestQueues.serviceRequests.length}</span>
                            </h3>
                            <Link href="/dashboard/admin/services" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                Vezi Tot <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-850 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {data.requestQueues.serviceRequests.map((sr) => (
                                <div key={sr.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-white">{sr.client_name}</p>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                            sr.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                            : sr.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                        }`}>{sr.status === 'resolved' ? 'Rezolvat' : sr.status === 'contacted' ? 'Contactat' : 'Pending'}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium">{sr.category_title}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <a href={`tel:${sr.client_phone}`} className="text-[10px] text-cyan-400 hover:underline font-semibold">{sr.client_phone}</a>
                                        <span className="text-[9px] text-slate-600">{timeAgo(sr.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {data.requestQueues.serviceRequests.length === 0 && (
                                <div className="px-5 py-8 text-center text-xs text-slate-500">Nu există solicitări de servicii.</div>
                            )}
                        </div>
                    </div>

                    {/* Calculator Requests */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Solicitări Calculator
                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">{data.requestQueues.calculatorRequests.length}</span>
                            </h3>
                            <Link href="/dashboard/admin/solicitari-proprietari" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                Vezi Tot <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-850 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {data.requestQueues.calculatorRequests.map((cr) => (
                                <div key={cr.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-white">{cr.name}</p>
                                        <span className="text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full capitalize">{cr.selected_model}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <a href={`tel:${cr.phone}`} className="text-[10px] text-cyan-400 hover:underline font-semibold">{cr.phone}</a>
                                        <span className="text-[10px] text-emerald-400 font-bold">€{formatNum(cr.property_value)}</span>
                                    </div>
                                    <span className="text-[9px] text-slate-600">{timeAgo(cr.created_at)}</span>
                                </div>
                            ))}
                            {data.requestQueues.calculatorRequests.length === 0 && (
                                <div className="px-5 py-8 text-center text-xs text-slate-500">Nu există solicitări din calculator.</div>
                            )}
                        </div>
                    </div>

                    {/* Open Tickets */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Ticket className="w-3.5 h-3.5 text-rose-400" /> Tickets Deschise
                                <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-1.5 py-0.5 rounded-full">{data.requestQueues.openTickets.length}</span>
                            </h3>
                            <Link href="/dashboard/admin/tickets" className="text-[9px] font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                                Vezi Tot <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-850 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                            {data.requestQueues.openTickets.map((t) => (
                                <div key={t.id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-bold text-white truncate mr-2">{t.subject}</p>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                            t.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                                            : t.priority === 'low' ? 'bg-slate-500/10 text-slate-400 border-slate-500/25'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                        }`}>{t.priority}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] text-slate-400">{t.user_name}</p>
                                        <span className="text-[9px] text-slate-600">{timeAgo(t.created_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {data.requestQueues.openTickets.length === 0 && (
                                <div className="px-5 py-8 text-center text-xs text-slate-500">Nu există tickets deschise.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { 
    Coins, 
    Search, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Users, 
    Calendar, 
    ArrowLeft, 
    RefreshCw, 
    SlidersHorizontal,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { getAdminCreditHistory } from '@/app/lib/actions/credits';

export default function AdminCreditHistoryPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    // Filters state
    const [search, setSearch] = useState('');
    const [type, setType] = useState('all'); // all, earned, spent
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Stats
    const [stats, setStats] = useState({
        totalGranted: 0,
        totalSpent: 0,
        activeUsersCount: 0
    });

    const loadData = async () => {
        setLoading(true);
        const res = await getAdminCreditHistory();
        if (res && 'transactions' in res) {
            const list = res.transactions || [];
            setTransactions(list);
            setFilteredTransactions(list);
            calculateStats(list);
        } else if (res && 'error' in res) {
            alert('Eroare: ' + res.error);
        }
        setLoading(false);
    };

    const calculateStats = (list: any[]) => {
        let granted = 0;
        let spent = 0;
        const uniqueUsers = new Set();

        list.forEach(tx => {
            if (tx.amount > 0) {
                granted += tx.amount;
            } else {
                spent += Math.abs(tx.amount);
            }
            if (tx.user_id) {
                uniqueUsers.add(tx.user_id);
            }
        });

        setStats({
            totalGranted: granted,
            totalSpent: spent,
            activeUsersCount: uniqueUsers.size
        });
    };

    useEffect(() => {
        loadData();
    }, []);

    // Apply filters locally for instant responsiveness
    useEffect(() => {
        let result = [...transactions];

        // 1. Search filter
        if (search.trim()) {
            const query = search.toLowerCase();
            result = result.filter(tx => {
                const userName = tx.profiles?.full_name?.toLowerCase() || '';
                const userEmail = tx.profiles?.email?.toLowerCase() || '';
                const description = tx.description?.toLowerCase() || '';
                const refCode = tx.metadata?.reference_id?.toLowerCase() || '';
                
                return userName.includes(query) || 
                       userEmail.includes(query) || 
                       description.includes(query) || 
                       refCode.includes(query);
            });
        }

        // 2. Type filter
        if (type === 'earned') {
            result = result.filter(tx => tx.amount > 0);
        } else if (type === 'spent') {
            result = result.filter(tx => tx.amount < 0);
        }

        // 3. Date range filters
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            result = result.filter(tx => new Date(tx.created_at) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            result = result.filter(tx => new Date(tx.created_at) <= end);
        }

        setFilteredTransactions(result);
    }, [search, type, startDate, endDate, transactions]);

    const handleReset = () => {
        setSearch('');
        setType('all');
        setStartDate('');
        setEndDate('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
                    <span>Se încarcă istoricul de credite...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/dashboard/admin" 
                        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la Console
                    </Link>
                    <button 
                        onClick={loadData}
                        className="p-2 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all flex items-center gap-1.5 text-xs"
                    >
                        <RefreshCw size={14} /> Reîncarcă Datele
                    </button>
                </div>

                {/* Header */}
                <header>
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Coins className="w-8 h-8 text-yellow-500" />
                        Istoric Credite Global
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Monitorizează toate tranzacțiile de credite din platformă: alimentări, recompense, consum tool-uri AI și promovări.
                    </p>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Credite Acordate</div>
                            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">+{stats.totalGranted.toLocaleString()} CR</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Credite Consumate</div>
                            <div className="text-2xl font-black text-red-400 font-mono mt-1">-{stats.totalSpent.toLocaleString()} CR</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Utilizatori Activi (Tranzacționat)</div>
                            <div className="text-2xl font-black text-blue-400 font-mono mt-1">{stats.activeUsersCount} Utilizatori</div>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-3">
                        <SlidersHorizontal size={16} /> Filtrează Tranzacții
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Caută utilizator, email, descriere..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors"
                            />
                        </div>

                        {/* Type Dropdown */}
                        <div>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors [color-scheme:dark]"
                            >
                                <option value="all">Toate Tranzacțiile</option>
                                <option value="earned">Doar Recompense / Alimentări (+)</option>
                                <option value="spent">Doar Consum / Deductions (-)</option>
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input 
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors [color-scheme:dark]"
                                placeholder="Dată start"
                            />
                        </div>

                        {/* End Date */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            <input 
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors [color-scheme:dark]"
                                placeholder="Dată sfârșit"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleReset}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition-all border border-slate-700"
                        >
                            Resetează Filtre
                        </button>
                    </div>
                </section>

                {/* Table Logs Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-yellow-500" />
                            <h2 className="text-lg font-bold">Jurnal Tranzacții de Credite ({filteredTransactions.length})</h2>
                        </div>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="p-12 text-center text-slate-500 italic">Nu a fost găsită nicio tranzacție conform filtrelor selectate.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-950/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Utilizator</th>
                                        <th className="px-6 py-4">Data & Ora</th>
                                        <th className="px-6 py-4">Descriere</th>
                                        <th className="px-6 py-4 text-right">Sumă</th>
                                        <th className="px-6 py-4">Metadata / Detalii</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {filteredTransactions.map((tx) => {
                                        const isPositive = tx.amount > 0;
                                        return (
                                            <tr key={tx.id} className="hover:bg-slate-950/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white">{tx.profiles?.full_name || 'Utilizator Fără Nume'}</div>
                                                    <div className="text-[10px] text-slate-500">{tx.profiles?.email || 'N/A'}</div>
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{tx.profiles?.role || 'client'}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 font-mono">
                                                    {new Date(tx.created_at).toLocaleString('ro-RO')}
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 font-medium">
                                                    {tx.description}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                    {isPositive ? `+${tx.amount}` : tx.amount} CR
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-[10px] max-w-xs truncate" title={JSON.stringify(tx.metadata)}>
                                                    {tx.metadata?.reference_id && <span className="block text-amber-500">Ref: {tx.metadata.reference_id}</span>}
                                                    {tx.metadata?.property_id && <span className="block text-slate-400">Prop: {tx.metadata.property_id.slice(0, 8)}...</span>}
                                                    {Object.keys(tx.metadata || {}).filter(k => k !== 'reference_id' && k !== 'property_id').length > 0 && <span>{JSON.stringify(tx.metadata)}</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

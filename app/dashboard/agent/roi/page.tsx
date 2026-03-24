"use client";
import React, { useState, useEffect } from 'react';
import { DollarSign, Download, TrendingUp, Briefcase } from 'lucide-react';
import { formatCompactCurrency } from '@/app/lib/format';

export default function AgencyROI() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txRes, recRes] = await Promise.all([
                fetch('/api/finance/transactions?viewTeam=true'),
                fetch('/api/finance/records?viewTeam=true')
            ]);
            const txData = await txRes.json();
            const recData = await recRes.json();
            setTransactions(txData.transactions || []);
            setRecords(recData.records || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportCsv = () => {
        window.open('/api/finance/export?format=csv&type=all&viewTeam=true', '_blank');
    };

    // Calculate overall metrics
    const totalCommissions = transactions.reduce((sum, tx) => sum + (Number(tx.commission_amount) || 0), 0);
    const totalExpenses = records.filter(r => r.record_type === 'expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const agencyRevenues = records.filter(r => r.record_type === 'revenue').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const netProfit = totalCommissions + agencyRevenues - totalExpenses;
    const roiPercentage = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(1) : 0;

    // Grouping by agent (simplified)
    const agentStats: Record<string, { deals: number, volume: number, comms: number }> = {};
    transactions.forEach(tx => {
        const name = tx.profiles?.full_name || 'Unknown Agent';
        if (!agentStats[name]) agentStats[name] = { deals: 0, volume: 0, comms: 0 };
        agentStats[name].deals += 1;
        agentStats[name].volume += Number(tx.transaction_value);
        agentStats[name].comms += Number(tx.commission_amount);
    });

    if (loading) return <div className="p-8">Loading agency financials...</div>;

    const MetricCard = ({ title, value, type, subtitle }: { title: string, value: string, type: 'pos' | 'neg' | 'neutral', subtitle?: string }) => (
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{title}</h3>
            <div className={`text-4xl font-black ${type === 'pos' ? 'text-green-600' : type === 'neg' ? 'text-red-500' : 'text-slate-800'}`}>
                {value}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Agency ROI</h1>
                    <p className="text-slate-500 mt-1">Track centralized revenues, expenses, and overall profit margin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportCsv} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Export Agency Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Deals Value" value={`€${formatCompactCurrency(transactions.reduce((s,t)=>s+Number(t.transaction_value), 0))}`} type="neutral" subtitle="Combined volume across team" />
                <MetricCard title="Team Commissions" value={`€${totalCommissions.toLocaleString()}`} type="pos" subtitle="Total agency-in revenue" />
                <MetricCard title="Business Expenses" value={`€${totalExpenses.toLocaleString()}`} type="neg" subtitle="Including agency-wide expenses" />
                <div className={`border rounded-xl p-6 shadow-sm flex flex-col justify-center text-white ${netProfit >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                    <h3 className="text-sm font-bold opacity-90 mb-2 uppercase tracking-wide">Net Agency Profit</h3>
                    <div className="text-5xl font-black">€{netProfit.toLocaleString()}</div>
                    <p className="text-sm font-medium opacity-90 mt-2">ROI: {roiPercentage}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-slate-400" /> Top Performers</h2>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-xs">
                                    <tr><th className="p-4">Agent Name</th><th className="p-4 text-center">Deals</th><th className="p-4 text-right">Volume</th><th className="p-4 text-right">Commission Generated</th></tr>
                                </thead>
                                <tbody className="divide-y text-slate-700 font-medium">
                                    {Object.entries(agentStats).sort((a,b)=>b[1].comms - a[1].comms).map(([name, stats]) => (
                                        <tr key={name} className="hover:bg-slate-50">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{name.charAt(0)}</div>
                                                {name}
                                            </td>
                                            <td className="p-4 text-center">{stats.deals}</td>
                                            <td className="p-4 text-right text-slate-500">€{formatCompactCurrency(stats.volume)}</td>
                                            <td className="p-4 text-right font-bold text-green-600">€{stats.comms.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {Object.keys(agentStats).length === 0 && (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-500">No deals logged by the team yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white border rounded-xl shadow-sm p-6">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-6">Recent Team Expenses</h2>
                        <div className="space-y-4">
                            {records.filter(r => r.record_type === 'expense').slice(0, 5).map(rec => (
                                <div key={rec.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <div className="font-bold text-slate-800 capitalize text-sm">{rec.category}</div>
                                        <div className="text-xs text-slate-500">{rec.profiles?.full_name || 'System'}</div>
                                    </div>
                                    <div className="font-bold text-red-600">-€{rec.amount.toLocaleString()}</div>
                                </div>
                            ))}
                            {records.filter(r => r.record_type === 'expense').length === 0 && (
                                <p className="text-sm text-slate-500 text-center py-4">No recent expenses.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Download, TrendingUp, TrendingDown, Check, X, FileText } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function AgentFinances() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'deals' | 'expenses'>('deals');

    // Forms
    const [dealForm, setDealForm] = useState(false);
    const [expenseForm, setExpenseForm] = useState(false);
    
    // Deal State
    const [propRef, setPropRef] = useState('');
    const [leadRef, setLeadRef] = useState('');
    const [txValue, setTxValue] = useState('');
    const [commission, setCommission] = useState('');
    const [txType, setTxType] = useState('sale');
    const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

    // Expense State
    const [exCategory, setExCategory] = useState('marketing');
    const [exAmount, setExAmount] = useState('');
    const [exDesc, setExDesc] = useState('');
    const [exDate, setExDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [txRes, recRes] = await Promise.all([
                fetch('/api/finance/transactions'),
                fetch('/api/finance/records')
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

    const submitDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/finance/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_ref: propRef,
                    lead_ref: leadRef,
                    transaction_value: Number(txValue),
                    commission_amount: Number(commission),
                    transaction_type: txType,
                    transaction_date: txDate
                })
            });
            setDealForm(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const submitExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/finance/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    record_type: 'expense',
                    category: exCategory,
                    amount: Number(exAmount),
                    description: exDesc,
                    record_date: exDate
                })
            });
            setExpenseForm(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string, isTx: boolean) => {
        if (!confirm('Are you sure?')) return;
        try {
            await fetch(isTx ? '/api/finance/transactions' : '/api/finance/records', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            fetchData();
        } catch (e) {}
    };

    const exportCsv = () => {
        window.open('/api/finance/export?format=csv&type=all', '_blank');
    };

    // Metrics calculation
    const totalTxValue = transactions.reduce((sum, tx) => sum + (Number(tx.transaction_value) || 0), 0);
    const totalCommissions = transactions.reduce((sum, tx) => sum + (Number(tx.commission_amount) || 0), 0);
    const totalExpenses = records.filter(r => r.record_type === 'expense').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const totalRevenues = records.filter(r => r.record_type === 'revenue').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const netProfit = totalCommissions + totalRevenues - totalExpenses;

    const MetricCard = ({ title, value, type }: { title: string, value: number, type: 'pos' | 'neg' | 'neutral' }) => (
        <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">{title}</h3>
            <div className={`text-3xl font-bold ${type === 'pos' ? 'text-green-600' : type === 'neg' ? 'text-red-500' : 'text-slate-800'}`}>
                €{value.toLocaleString()}
            </div>
        </div>
    );

    if (loading) return <div className="p-8">Loading finances...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Finances</h1>
                    <p className="text-slate-500 mt-1">Track your deals, commissions, and calculate net profit.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportCsv} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Volume" value={totalTxValue} type="neutral" />
                <MetricCard title="Commissions" value={totalCommissions} type="pos" />
                <MetricCard title="Expenses" value={totalExpenses} type="neg" />
                <MetricCard title="Net Profit" value={netProfit} type={netProfit >= 0 ? 'pos' : 'neg'} />
            </div>

            {/* Tabs & Content */}
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                <div className="flex border-b">
                    <button onClick={() => setTab('deals')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${tab === 'deals' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>My Deals</button>
                    <button onClick={() => setTab('expenses')} className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${tab === 'expenses' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>My Expenses</button>
                </div>

                <div className="p-6">
                    {tab === 'deals' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">Closed Deals</h2>
                                <button onClick={() => setDealForm(!dealForm)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                                    {dealForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4" />} {dealForm ? 'Cancel' : 'Add Deal'}
                                </button>
                            </div>

                            {dealForm && (
                                <form onSubmit={submitDeal} className="bg-slate-50 border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Property ID / Ref</label><input required className="w-full border rounded-md p-2" value={propRef} onChange={(e)=>setPropRef(e.target.value)} placeholder="e.g. P124" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Lead Name / Ref</label><input required className="w-full border rounded-md p-2" value={leadRef} onChange={(e)=>setLeadRef(e.target.value)} placeholder="Client info" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Transaction Type</label>
                                        <select className="w-full border rounded-md p-2" value={txType} onChange={(e)=>setTxType(e.target.value)}><option value="sale">Sale</option><option value="rent">Rent</option></select>
                                    </div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Date</label><input type="date" required className="w-full border rounded-md p-2" value={txDate} onChange={(e)=>setTxDate(e.target.value)} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Property Value (€)</label><input type="number" required className="w-full border rounded-md p-2" value={txValue} onChange={(e)=>setTxValue(e.target.value)} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">My Commission (€)</label><input type="number" required className="w-full border rounded-md p-2" value={commission} onChange={(e)=>setCommission(e.target.value)} /></div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">Save Deal</button>
                                    </div>
                                </form>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-y text-slate-500 font-medium">
                                        <tr><th className="p-3">Date</th><th className="p-3">Property</th><th className="p-3">Client</th><th className="p-3">Type</th><th className="p-3 text-right">Value</th><th className="p-3 text-right">Commission</th><th className="p-3 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-slate-50">
                                                <td className="p-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                                                <td className="p-3 font-medium text-blue-600">{tx.property_ref}</td>
                                                <td className="p-3">{tx.lead_ref}</td>
                                                <td className="p-3 uppercase text-xs font-bold">{tx.transaction_type}</td>
                                                <td className="p-3 text-right">€{tx.transaction_value.toLocaleString()}</td>
                                                <td className="p-3 text-right font-bold text-green-600">€{tx.commission_amount.toLocaleString()}</td>
                                                <td className="p-3 text-right text-xs"><button onClick={() => handleDelete(tx.id, true)} className="text-red-500 hover:underline">Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {transactions.length === 0 && <p className="text-center text-slate-500 py-8">No deals logged yet.</p>}
                            </div>
                        </div>
                    )}

                    {tab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold text-slate-800">Business Expenses</h2>
                                <button onClick={() => setExpenseForm(!expenseForm)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700">
                                    {expenseForm ? <X className="w-4 h-4"/> : <Plus className="w-4 h-4" />} {expenseForm ? 'Cancel' : 'Add Expense'}
                                </button>
                            </div>

                            {expenseForm && (
                                <form onSubmit={submitExpense} className="bg-slate-50 border rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Category</label><input required className="w-full border rounded-md p-2" value={exCategory} onChange={(e)=>setExCategory(e.target.value)} placeholder="e.g. Marketing, Gas, Online Ads" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Date</label><input type="date" required className="w-full border rounded-md p-2" value={exDate} onChange={(e)=>setExDate(e.target.value)} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Description</label><input className="w-full border rounded-md p-2" value={exDesc} onChange={(e)=>setExDesc(e.target.value)} placeholder="Optional details" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 mb-1 block">Amount (€)</label><input type="number" required className="w-full border rounded-md p-2" value={exAmount} onChange={(e)=>setExAmount(e.target.value)} /></div>
                                    <div className="md:col-span-2 flex justify-end">
                                        <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium">Save Expense</button>
                                    </div>
                                </form>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-y text-slate-500 font-medium">
                                        <tr><th className="p-3">Date</th><th className="p-3">Category</th><th className="p-3">Description</th><th className="p-3 text-right">Amount</th><th className="p-3 text-right">Actions</th></tr>
                                    </thead>
                                    <tbody className="divide-y text-slate-700">
                                        {records.filter(r => r.record_type === 'expense').map(rec => (
                                            <tr key={rec.id} className="hover:bg-slate-50">
                                                <td className="p-3">{new Date(rec.record_date).toLocaleDateString()}</td>
                                                <td className="p-3 font-medium capitalize">{rec.category}</td>
                                                <td className="p-3">{rec.description || '-'}</td>
                                                <td className="p-3 text-right font-bold text-red-600">€{rec.amount.toLocaleString()}</td>
                                                <td className="p-3 text-right text-xs"><button onClick={() => handleDelete(rec.id, false)} className="text-red-500 hover:underline">Delete</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {records.filter(r => r.record_type === 'expense').length === 0 && <p className="text-center text-slate-500 py-8">No expenses logged yet.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

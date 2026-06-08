'use client';

import React, { useEffect, useState } from 'react';
import { getPresentationContractsForAdmin, deletePresentationContract } from '@/app/lib/actions/presentation-contracts';
import { FileText, Search, ExternalLink, Calendar, CheckCircle2, Clock, Trash2, User, Phone, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminPresentationContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'sent' | 'signed'>('all');

    const loadContracts = async () => {
        setLoading(true);
        const res = await getPresentationContractsForAdmin();
        if (res.success && res.contracts) {
            setContracts(res.contracts);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadContracts();
    }, []);

    const handleDeleteContract = async (contract: any) => {
        if (!window.confirm('Sunteți sigur că doriți să ștergeți acest contract definitiv? Ca administrator, această acțiune este directă și ireversibilă.')) return;

        const res = await deletePresentationContract(contract.id);
        if (res.success) {
            alert('Contractul a fost șters definitiv din sistem.');
            loadContracts();
        } else {
            alert('Eroare: ' + res.error);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    };

    const filteredContracts = contracts.filter((c) => {
        const clientName = c.client_details?.name || '';
        const agentName = c.agent?.full_name || c.agent_details?.fullName || '';
        const num = c.contract_number || '';
        const serialNum = `${c.contract_serial}/${c.contract_number}`;
        const query = searchTerm.toLowerCase();
        
        const matchesSearch = 
            clientName.toLowerCase().includes(query) ||
            agentName.toLowerCase().includes(query) ||
            num.toLowerCase().includes(query) ||
            serialNum.toLowerCase().includes(query);

        const matchesTab = 
            filterTab === 'all' || 
            (filterTab === 'sent' && c.status === 'sent') || 
            (filterTab === 'signed' && c.status === 'signed');

        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-red-500" />
                        Platform Presentation Contracts
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Consola administratorului pentru gestionarea și auditul tuturor contractelor de vizionare de pe platformă.
                    </p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Caută după agent, client sau număr..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-3">
                {(['all', 'sent', 'signed'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilterTab(tab)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                            filterTab === tab
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        {tab === 'all' ? 'Toate' : tab === 'sent' ? 'Trimise / În așteptare' : 'Semnate'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                            <div className="h-6 bg-slate-100 rounded w-2/3" />
                            <div className="h-4 bg-slate-100 rounded w-1/2" />
                            <div className="pt-4 border-t border-slate-50 flex gap-2">
                                <div className="h-8 bg-slate-100 rounded flex-1" />
                                <div className="h-8 bg-slate-100 rounded w-10" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredContracts.length === 0 ? (
                <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Nu s-a găsit niciun contract</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Nu există contracte de vizionare active în sistem care să corespundă criteriilor de căutare.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map((c) => {
                        const isSigned = c.status === 'signed';
                        const clientName = c.client_details?.name || 'Nespecificat';
                        const agentName = c.agent?.full_name || c.agent_details?.fullName || 'Nespecificat';
                        const number = `${c.contract_serial}/${c.contract_number}`;
                        const createdDate = new Date(c.created_at).toLocaleDateString('ro-RO');

                        // negotiated commissions info
                        const commType = c.negotiated_commission_type;
                        const buyComm = c.negotiated_commission_buy || 0;
                        const rentComm = c.negotiated_commission_rent || 0;

                        return (
                            <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                                <div className="space-y-4">
                                    {/* Top meta row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider">
                                            {number}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                            isSigned 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {isSigned ? 'Semnat' : 'Trimis'}
                                        </span>
                                    </div>

                                    {/* Agent & Client */}
                                    <div className="space-y-2 border-b border-slate-50 pb-3">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Broker / Agent</span>
                                            <span className="text-sm font-bold text-slate-700">{agentName}</span>
                                            <span className="text-xs text-slate-400 block">{c.agent?.email || c.agent_details?.email}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Client / Lead</span>
                                            <span className="text-sm font-bold text-slate-700">{clientName}</span>
                                            <span className="text-xs text-slate-400 block">{c.client_details?.email || 'Fără email'}</span>
                                        </div>
                                    </div>

                                    {/* Commission Specifications */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Comisioane Negociate:</div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-500 block">Cumpărare:</span>
                                                <span className="font-bold text-slate-800">
                                                    {commType === 'percent' ? `${buyComm}%` : formatCurrency(buyComm)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 block">Închiriere:</span>
                                                <span className="font-bold text-slate-800">
                                                    {commType === 'percent' ? `${rentComm}%` : formatCurrency(rentComm)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata dates */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Generat: {createdDate}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-50">
                                    <Link
                                        href={`/properties/presentation-contract-preview?id=${c.id}`}
                                        target="_blank"
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Deschide</span>
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteContract(c)}
                                        className="p-2 rounded-xl border bg-slate-50 hover:bg-red-50 border-slate-200 hover:border-red-350 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center cursor-pointer"
                                        title="Șterge definitiv (Admin)"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

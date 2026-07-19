'use client';

import React, { useState, useMemo } from 'react';
import { 
    Search, User, Phone, Calendar, Sliders, CheckCircle2, 
    Sparkles, Coins, FileText, ChevronRight, X, Clock, ExternalLink 
} from 'lucide-react';

interface CalculatorRequest {
    id: string;
    name: string;
    phone: string;
    property_value: number;
    selected_model: string;
    is_exclusive: boolean;
    exclusivity_days: number;
    selected_services: Array<{
        id: string;
        name: string;
        category: string;
        cost: number;
        coef: number;
        pay_mode: string;
    }>;
    calculations: {
        tier_factor: number;
        final_seller_percent: number;
        final_buyer_percent: number;
        seller_commission_eur: number;
        buyer_commission_eur: number;
        total_commission_eur: number;
        seller_total_outlay_eur: number;
        total_services_cost_eur: number;
        monthly_services_cost_eur: number;
    };
    created_at: string;
}

export default function CalculatorRequestsClient({ initialRequests }: { initialRequests: CalculatorRequest[] }) {
    const [requests, setRequests] = useState<CalculatorRequest[]>(initialRequests);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRequest, setSelectedRequest] = useState<CalculatorRequest | null>(null);

    // Filter requests
    const filteredRequests = useMemo(() => {
        return requests.filter(req => {
            const query = searchQuery.toLowerCase();
            return (
                req.name.toLowerCase().includes(query) ||
                req.phone.toLowerCase().includes(query) ||
                req.selected_model.toLowerCase().includes(query)
            );
        });
    }, [requests, searchQuery]);

    // Helpers
    const formatEUR = (num: number) => {
        return num.toLocaleString('ro-RO') + ' €';
    };

    const formatPercent = (num: number) => {
        return num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('ro-RO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getModelLabel = (modelKey: string) => {
        switch (modelKey) {
            case 'zero-seller': return '0% Vânzător / 2% Cumpărător';
            case 'standard-seller': return 'Standard Vânzător (2% / 0%)';
            case 'fixed-fee': return 'Tarif Fix Pre-stabilit';
            case 'shared-commission': return 'Comision Partajat';
            default: return modelKey;
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Caută după nume, telefon sau model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                    />
                </div>
                <div className="text-xs font-semibold text-slate-400 shrink-0">
                    Total solicitări: <span className="text-white">{filteredRequests.length}</span>
                </div>
            </div>

            {/* Inquiries Table list */}
            <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                <th className="p-4">Proprietar</th>
                                <th className="p-4">Date Contact</th>
                                <th className="p-4">Evaluare</th>
                                <th className="p-4">Tip Contract</th>
                                <th className="p-4 text-right">Dată</th>
                                <th className="p-4 text-center">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-slate-800/25 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-white flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            {req.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-300 flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                                            {req.phone}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-white">
                                            {formatEUR(Number(req.property_value))}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {getModelLabel(req.selected_model)}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                            req.is_exclusive 
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                                : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {req.is_exclusive ? `Exclusiv (${req.exclusivity_days} zile)` : 'Non-exclusiv'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right text-slate-400">
                                        <div className="flex items-center justify-end gap-1.5 text-[10px]">
                                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                                            {formatDate(req.created_at)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 mx-auto"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Vezi Document
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRequests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        Nu s-au găsit solicitări care să corespundă criteriilor de căutare.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL DIALOG MODAL */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                    Detaliu Servicii Selectate
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    Simulare completă generată pentru proprietarul {selectedRequest.name}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
                            {/* Contact Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Proprietar</h4>
                                    <p className="text-sm font-bold text-white">{selectedRequest.name}</p>
                                    <p className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                                        {selectedRequest.phone}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Proprietate</h4>
                                    <p className="text-sm font-bold text-white">Valoare: {formatEUR(Number(selectedRequest.property_value))}</p>
                                    <p className="text-xs text-slate-350">
                                        Model: <span className="font-semibold text-slate-200">{getModelLabel(selectedRequest.selected_model)}</span>
                                    </p>
                                    <p className="text-xs text-slate-350">
                                        Regim: <span className="font-semibold text-slate-200">{selectedRequest.is_exclusive ? `Exclusiv (${selectedRequest.exclusivity_days} zile)` : 'Non-exclusiv'}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="bg-gradient-to-r from-orange-950/40 to-amber-950/20 border border-orange-500/20 p-5 rounded-2xl">
                                <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Rezumat Cotație Calculată</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="text-xl font-extrabold text-white">{formatPercent(Number(selectedRequest.calculations.final_seller_percent))}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Comision Vânzător</div>
                                    </div>
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="text-xl font-extrabold text-white">{formatEUR(Number(selectedRequest.calculations.seller_commission_eur))}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Valoare Comision</div>
                                    </div>
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="text-xl font-extrabold text-white">{formatEUR(Number(selectedRequest.calculations.seller_total_outlay_eur))}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Total Cost Vânzător</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center mt-3">
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="text-lg font-extrabold text-slate-200">{formatEUR(Number(selectedRequest.calculations.total_services_cost_eur))}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 font-bold">Cost Total Servicii</div>
                                    </div>
                                    <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                                        <div className="text-lg font-extrabold text-slate-200">{formatEUR(Number(selectedRequest.calculations.monthly_services_cost_eur))}</div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5 font-bold">Cost Lunar Servicii</div>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Services list */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Servicii Selectate</h4>
                                <div className="space-y-2.5">
                                    {selectedRequest.selected_services.map((s, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-950/20 border border-slate-800/50 rounded-xl">
                                            <div>
                                                <div className="font-bold text-slate-200 text-xs">{s.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">Categorie: {s.category} | Platit prin: {s.pay_mode === 'commission' ? 'Comision' : 'Cash separat'}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="font-extrabold text-white text-xs">
                                                    {s.pay_mode === 'commission' 
                                                        ? `+${formatPercent(s.coef * selectedRequest.calculations.tier_factor)}` 
                                                        : formatEUR(s.cost)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedRequest.selected_services.length === 0 && (
                                        <div className="text-slate-500 text-center text-xs py-4">Niciun serviciu adițional selectat.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                                Închide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

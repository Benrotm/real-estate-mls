'use client';

import React, { useEffect, useState } from 'react';
import { getCollaborationContractsForAgent, deleteCollaborationContract } from '@/app/lib/actions/collaboration-contracts';
import { FileText, Search, Share2, Printer, ExternalLink, Calendar, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AgentCollaborationContractsPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleDeleteContract = async (contract: any) => {
        const isLocked = contract.is_locked;
        let confirmMsg = '';
        if (isLocked) {
            confirmMsg = 'Acest contract este BLOCAT. Ștergerea lui necesită aprobarea unui administrator sau a liderului de echipă. Trimiteți solicitarea de ștergere?';
        } else {
            confirmMsg = 'Sunteți sigur că doriți să ștergeți acest contract definitiv?';
        }
        
        if (!window.confirm(confirmMsg)) return;
        
        const res = await deleteCollaborationContract(contract.id);
        if (res.success) {
            if (res.deleted) {
                alert('Contractul a fost șters cu succes.');
            } else if (res.deleteRequested) {
                alert('Contractul este blocat. Solicitarea de ștergere a fost trimisă către admin/team leader.');
            }
            loadContracts();
        } else {
            alert('Eroare: ' + res.error);
        }
    };

    const loadContracts = async () => {
        setLoading(true);
        const res = await getCollaborationContractsForAgent();
        if (res.success && res.contracts) {
            setContracts(res.contracts);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadContracts();
    }, []);

    const handleShare = async (id: string) => {
        const shareUrl = `${window.location.origin}/properties/contract-preview?id=${id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Contract de Colaborare & Anexă',
                    text: 'Vizualizează contractul de colaborare și anexa.',
                    url: shareUrl
                });
            } catch (err) {
                console.log('Share was cancelled or failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    const filteredContracts = contracts.filter((c) => {
        const ownerName = c.form_data?.ownerName || '';
        const title = c.form_data?.title || '';
        const num = c.contract_number || '';
        const query = searchTerm.toLowerCase();
        return (
            ownerName.toLowerCase().includes(query) ||
            title.toLowerCase().includes(query) ||
            num.toLowerCase().includes(query)
        );
    });

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contracte de Colaborare</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Gestionează și vizualizează contractele de colaborare imobiliară generate.
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Caută după proprietar, titlu sau număr..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
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
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
                        <FileText className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Nu s-a găsit niciun contract</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                        Poți genera un contract nou din Pasul 4 al formularului de adăugare sau editare proprietate.
                    </p>
                    <Link
                        href="/properties/add"
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-all shadow-md shadow-orange-500/10"
                    >
                        Adaugă Proprietate
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContracts.map((c) => {
                        const isSigned = c.status === 'signed';
                        const ownerName = c.form_data?.ownerName || 'Nespecificat';
                        const title = c.form_data?.title || 'Nespecificat';
                        const number = `${c.contract_serial}/${c.contract_number}`;
                        const createdDate = new Date(c.created_at).toLocaleDateString('ro-RO');

                        return (
                            <div key={c.id} className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div className="space-y-3.5">
                                    {/* Top meta row */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-mono font-semibold text-slate-400 tracking-wider">
                                            {number}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                                            isSigned 
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                            {isSigned ? (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    Semnat
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="w-3 h-3 text-amber-600" />
                                                    Trimis
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    {/* Owner and details */}
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">
                                            {ownerName}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                            {title}
                                        </p>
                                    </div>

                                    {/* Metadata dates */}
                                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-50 font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Creat: {createdDate}</span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-50">
                                    <Link
                                        href={`/properties/contract-preview?id=${c.id}`}
                                        target="_blank"
                                        className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Deschide</span>
                                    </Link>

                                    {c.anexa_data && (
                                        <Link
                                            href={`/properties/anexa1-preview?id=${c.id}`}
                                            target="_blank"
                                            className="flex-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 font-semibold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                                        >
                                            <FileText className="w-3.5 h-3.5 text-cyan-500" />
                                            <span>Vezi Anexa 1</span>
                                        </Link>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleShare(c.id)}
                                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                                            copiedId === c.id
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
                                        }`}
                                        title="Copiază link-ul contractului"
                                    >
                                        {copiedId === c.id ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <Share2 className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteContract(c)}
                                        className="p-2 rounded-xl border bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center"
                                        title={c.is_locked ? "Solicită ștergerea (Contract Blocat)" : "Șterge contractul"}
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

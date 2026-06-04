'use client';

import React, { useEffect, useState } from 'react';
import { 
    getCollaborationContractDeleteRequests, 
    approveDeleteCollaborationContract, 
    rejectDeleteCollaborationContract 
} from '@/app/lib/actions/collaboration-contracts';
import { FileText, CheckCircle2, XCircle, Trash2, ExternalLink, ShieldAlert, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DeletionRequestsClient({ isAdmin }: { isAdmin: boolean }) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    const loadRequests = async () => {
        setLoading(true);
        const res = await getCollaborationContractDeleteRequests();
        if (res.success && res.contracts) {
            setRequests(res.contracts);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async (id: string, serial: string, num: string) => {
        if (!window.confirm(`Sunteți sigur că doriți să APROBAȚI ștergerea contractului ${serial}/${num}? Acest contract va fi șters definitiv din baza de date.`)) {
            return;
        }
        setSubmittingId(id);
        const res = await approveDeleteCollaborationContract(id);
        if (res.success) {
            alert('Contractul a fost șters definitiv cu succes.');
            loadRequests();
        } else {
            alert('Eroare: ' + res.error);
        }
        setSubmittingId(null);
    };

    const handleReject = async (id: string, serial: string, num: string) => {
        if (!window.confirm(`Sunteți sigur că doriți să RESPINGEȚI solicitarea de ștergere pentru contractul ${serial}/${num}? Contractul va rămâne blocat în baza de date.`)) {
            return;
        }
        setSubmittingId(id);
        const res = await rejectDeleteCollaborationContract(id);
        if (res.success) {
            alert('Solicitarea de ștergere a fost respinsă. Contractul a fost păstrat.');
            loadRequests();
        } else {
            alert('Eroare: ' + res.error);
        }
        setSubmittingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm text-white">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2.5">
                        <ShieldAlert className="w-6 h-6 text-orange-500 animate-pulse" />
                        Solicitări Ștergere Contracte
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {isAdmin 
                            ? 'Console Administrator: Aprobă sau respinge ștergerea contractelor blocate de pe platformă.' 
                            : 'Workspace Team Leader: Aprobă sau respinge solicitările de ștergere din echipa ta.'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-1/4" />
                            <div className="h-6 bg-slate-800 rounded w-1/2" />
                            <div className="h-4 bg-slate-800 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Nicio solicitare pendinte</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        Nu există contracte blocate cu cereri de ștergere în acest moment.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="p-4 text-xs font-bold">Contract</th>
                                    <th className="p-4 text-xs font-bold">Proprietar & Detalii</th>
                                    <th className="p-4 text-xs font-bold">Solicitant (Agent)</th>
                                    <th className="p-4 text-xs font-bold">Dată Solicitare</th>
                                    <th className="p-4 text-xs font-bold text-right">Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((r) => {
                                    const number = `${r.contract_serial}/${r.contract_number}`;
                                    const ownerName = r.form_data?.ownerName || 'Nespecificat';
                                    const title = r.form_data?.title || 'Nespecificat';
                                    const agentName = r.agent?.full_name || 'Nespecificat';
                                    const agentEmail = r.agent?.email || '';
                                    const requestDate = new Date(r.updated_at).toLocaleDateString('ro-RO', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                                    const isPending = submittingId === r.id;

                                    return (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono font-semibold text-slate-900 text-sm">
                                                        {number}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-0.5">
                                                        ID: {r.id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm">
                                                        {ownerName}
                                                    </span>
                                                    <span className="text-slate-500 text-xs mt-0.5 line-clamp-1">
                                                        {title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700 text-xs">
                                                        {agentName}
                                                    </span>
                                                    <span className="text-slate-400 text-[10px]">
                                                        {agentEmail}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    <span>{requestDate}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/properties/contract-preview?id=${r.id}`}
                                                        target="_blank"
                                                        className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-semibold"
                                                        title="Previzualizează contractul"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                        <span>Vezi</span>
                                                    </Link>

                                                    {r.anexa_data && (
                                                        <Link
                                                            href={`/properties/anexa1-preview?id=${r.id}`}
                                                            target="_blank"
                                                            className="p-2 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-600 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-semibold"
                                                            title="Previzualizează Anexa 1"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>Anexă</span>
                                                        </Link>
                                                    )}

                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handleReject(r.id, r.contract_serial, r.contract_number)}
                                                        className="p-2 bg-slate-50 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-semibold disabled:opacity-50"
                                                        title="Respinge cererea de ștergere"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>Respinge</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handleApprove(r.id, r.contract_serial, r.contract_number)}
                                                        className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] font-bold disabled:opacity-50 animate-pulse hover:animate-none"
                                                        title="Aprobă și șterge definitiv"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span>Aprobă</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

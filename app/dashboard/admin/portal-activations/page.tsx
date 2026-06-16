'use client';

import { useState, useEffect } from 'react';
import { getAllPendingActivations, updateActivationStatus } from '@/app/lib/actions/portal-activations';
import { Check, X, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PortalActivationsPage() {
    const [activations, setActivations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchActivations();
    }, []);

    async function fetchActivations() {
        setLoading(true);
        const { data } = await getAllPendingActivations();
        setActivations(data || []);
        setLoading(false);
    }

    async function handleAction(id: string, status: 'active' | 'rejected') {
        setProcessingId(id);
        const { success, error } = await updateActivationStatus(id, status);
        if (success) {
            toast.success(`Activation request ${status}`);
            setActivations(activations.filter(a => a.id !== id));
        } else {
            toast.error(error || 'Failed to update activation');
        }
        setProcessingId(null);
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Portal Activation Requests</h1>
            
            {activations.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
                    <Globe className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No pending requests</h3>
                    <p className="text-slate-400">All portal activation requests have been processed.</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-sm">
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Portal</th>
                                <th className="p-4 font-medium">Requested At</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {activations.map((req) => (
                                <tr key={req.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{req.profiles?.full_name || 'Unknown User'}</div>
                                        <div className="text-slate-400 text-xs mt-1">{req.users?.email || 'No Email'}</div>
                                        {req.profiles?.phone && <div className="text-slate-500 text-xs mt-0.5">{req.profiles.phone}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 capitalize">
                                            {req.portal_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400">
                                        {new Date(req.requested_at).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleAction(req.id, 'active')}
                                            disabled={processingId === req.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors font-medium text-xs disabled:opacity-50"
                                        >
                                            {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'rejected')}
                                            disabled={processingId === req.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors font-medium text-xs disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

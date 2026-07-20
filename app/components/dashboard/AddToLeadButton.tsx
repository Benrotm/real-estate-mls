'use client';

import { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { addPropertyToLeadMatchingByLookup } from '@/app/lib/actions/matches';

export default function AddToLeadButton({ propertyId }: { propertyId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identifier.trim()) return;

        setLoading(true);
        setMessage(null);

        try {
            const res = await addPropertyToLeadMatchingByLookup(propertyId, identifier.trim());
            if (res.error) {
                setMessage({ type: 'error', text: res.error });
            } else if (res.success) {
                setMessage({
                    type: 'success',
                    text: `Property added to "${res.leadName}" ('To Verify' tab)!`
                });
                setIdentifier('');
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage(null);
                }, 2500);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'An error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all active:scale-95 border border-violet-400/30"
            >
                <UserPlus className="w-4 h-4 text-violet-200" />
                Add To Lead Matching
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={() => { setIsOpen(false); setMessage(null); }}
                            className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-violet-600/20 border border-violet-500/30 rounded-xl">
                                <UserPlus className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Add To Lead Matching</h3>
                                <p className="text-xs text-slate-400">Save property to a Lead's "To Verify" tab</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">
                                    Lead Phone Number or Lead ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 0712345678 or 5E7A2BB9"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium"
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                                    message.type === 'success' 
                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                }`}>
                                    {message.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                                    )}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsOpen(false); setMessage(null); }}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !identifier.trim()}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/30"
                                >
                                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    Save to "To Verify"
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

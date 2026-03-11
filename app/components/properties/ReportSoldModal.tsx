'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { submitSoldPrice } from '@/app/lib/actions/valuation';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';

interface ReportSoldModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    listingPrice: number;
    currency: string;
}

export default function ReportSoldModal({
    isOpen,
    onClose,
    propertyId,
    propertyTitle,
    listingPrice,
    currency
}: ReportSoldModalProps) {
    const [soldPrice, setSoldPrice] = useState<string>(listingPrice.toString());
    const [soldDate, setSoldDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [daysOnMarket, setDaysOnMarket] = useState<number>(0);
    const [createdAt, setCreatedAt] = useState<string | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    // Fetch property details to get created_at
    useEffect(() => {
        if (isOpen && propertyId) {
            async function fetchProperty() {
                const { data, error } = await supabase
                    .from('properties')
                    .select('created_at')
                    .eq('id', propertyId)
                    .single();

                if (data && !error) {
                    setCreatedAt(data.created_at);

                    // Auto-calculate Days on Market initially
                    const created = new Date(data.created_at);
                    const sold = new Date(soldDate);
                    const diff = Math.floor((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                    setDaysOnMarket(Math.max(0, diff));
                }
            }
            fetchProperty();
        }
    }, [isOpen, propertyId]);

    // Recalculate Days on Market when soldDate changes
    useEffect(() => {
        if (createdAt) {
            const created = new Date(createdAt);
            const sold = new Date(soldDate);
            const diff = Math.floor((sold.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            setDaysOnMarket(Math.max(0, diff));
        }
    }, [soldDate, createdAt]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await submitSoldPrice(
                propertyId,
                parseFloat(soldPrice),
                new Date(soldDate),
                notes,
                daysOnMarket
            );
            setSuccess(true);
            setTimeout(() => {
                onClose();
                router.refresh();
                router.push('/dashboard/owner/market');
            }, 2000);
        } catch (error) {
            console.error(error);
            alert('Failed to report sale. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                {success ? (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Property Marked as SOLD!</h2>
                        <p className="text-slate-400">The transaction price has been recorded and will contribute to market insights.</p>
                        <p className="text-xs text-slate-500 pt-4">Redirecting to Market Insights...</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-white">Report SOLD</h2>
                                <p className="text-sm text-slate-400 truncate max-w-[300px]">{propertyTitle}</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200/80">
                                This property will be moved to your SOLD inventory.
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Final Transaction Price ({currency})</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <DollarSign className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            value={soldPrice}
                                            onChange={(e) => setSoldPrice(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 italic px-1">Listing price: {listingPrice} {currency}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Sale Date</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="date"
                                            required
                                            value={soldDate}
                                            onChange={(e) => setSoldDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Days on Market</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            required
                                            value={daysOnMarket}
                                            onChange={(e) => setDaysOnMarket(parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 italic px-1">Auto-calculated from listing start: {createdAt ? new Date(createdAt).toLocaleDateString() : '...'}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Private Notes (Optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                                        placeholder="Any internal notes about the sale..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Confirm Sale
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

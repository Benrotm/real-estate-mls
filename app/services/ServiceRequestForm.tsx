'use client';

import React, { useState } from 'react';
import { createServiceRequest } from '@/app/lib/actions/services-marketplace';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

interface ServiceRequestFormProps {
    categorySlug: string;
    categoryTitle: string;
}

export default function ServiceRequestForm({ categorySlug, categoryTitle }: ServiceRequestFormProps) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [details, setDetails] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;
        
        setIsPending(true);
        setError(null);

        try {
            const res = await createServiceRequest(name, phone, categorySlug, categoryTitle, details);
            if (res.success) {
                setSubmitted(true);
                setName('');
                setPhone('');
                setDetails('');
            } else {
                setError(res.error || 'A apărut o eroare la trimiterea solicitării.');
            }
        } catch (err: any) {
            setError(err.message || 'Eroare tehnică la trimiterea solicitării.');
        } finally {
            setIsPending(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl text-center space-y-3 animate-in fade-in duration-300">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Solicitare Trimisă cu Succes!</h3>
                <p className="text-xs text-slate-350 leading-relaxed max-w-md mx-auto">
                    Solicitarea ta a fost înregistrată. Vei fi contactat în cel mai scurt timp de un furnizor de servicii partener.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-bold text-orange-450 hover:underline"
                >
                    Trimite o altă solicitare
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-850 p-6 sm:p-8 rounded-3xl space-y-4 text-left">
            <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                    Solicită Oferte / Consultanță pentru {categoryTitle}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                    Completează detaliile de mai jos și specialiștii autorizați te vor contacta direct.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Numele Tău</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Andrei Popescu"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                        required
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Număr Telefon</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 0722 000 000"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Detalii solicitare (ce anume ai nevoie?)</label>
                <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Ex: Doresc o ofertă pentru un certificat energetic pentru un apartament cu 2 camere în sectorul 3..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none resize-none transition-colors"
                />
            </div>

            {error && (
                <p className="text-xs text-rose-400 font-bold bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isPending || !name.trim() || !phone.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Se trimite...
                    </>
                ) : (
                    <>
                        <Send className="w-3.5 h-3.5" />
                        Trimite Solicitare
                    </>
                )}
            </button>
        </form>
    );
}

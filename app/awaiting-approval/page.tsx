'use client';

import { useState } from 'react';
import { ShieldAlert, LogOut, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function AwaitingApprovalPage() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            window.location.href = '/auth/login';
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                    <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-white">Cont în curs de verificare</h1>
                    <p className="text-sm font-bold text-slate-400">
                        Înregistrarea ta a fost finalizată cu succes!
                    </p>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed">
                    Pentru a menține integritatea și securitatea platformei noastre, înregistrarea pe Imobum este verificată manual de un administrator. Vei primi acces automat de îndată ce contul tău este activat.
                </p>

                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 text-xs font-semibold text-slate-400 flex items-start gap-2.5 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Te rugăm să revii mai târziu sau să contactezi suportul dacă consideri că există o întârziere nejustificată.</span>
                </div>

                <div className="pt-4">
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all border border-slate-700"
                    >
                        {isLoggingOut ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                            <LogOut className="w-4 h-4" />
                        )}
                        Deconectează-te
                    </button>
                </div>
            </div>
        </div>
    );
}

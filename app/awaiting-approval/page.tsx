'use client';

import { ShieldAlert, CheckCircle2 } from 'lucide-react';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.016-5.079-2.87-6.934C16.356 2.016 13.896 1 11.278 1 5.875 1 1.475 5.397 1.472 10.802c-.001 1.517.398 2.998 1.157 4.312L1.642 20.3l5.005-1.146zm11.758-5.324c-.314-.158-1.859-.918-2.148-1.023-.29-.105-.5-.158-.71.158-.21.314-.813 1.023-.996 1.233-.183.21-.366.236-.68.079-.314-.158-1.328-.49-2.529-1.561-.933-.833-1.564-1.862-1.747-2.178-.183-.315-.02-.485.137-.642.142-.141.315-.367.472-.551.157-.184.21-.315.315-.525.105-.21.053-.394-.026-.551-.079-.158-.71-1.712-.973-2.348-.255-.615-.515-.532-.71-.542-.183-.01-.393-.011-.603-.011s-.552.079-.84.394c-.288.315-1.101 1.077-1.101 2.626 0 1.549 1.128 3.045 1.285 3.255.158.21 2.221 3.391 5.38 4.757.753.325 1.341.52 1.8.664.757.241 1.446.207 1.99.126.607-.091 1.859-.761 2.122-1.458.263-.697.263-1.294.184-1.42-.079-.126-.29-.21-.604-.368z"/>
    </svg>
);

export default function AwaitingApprovalPage() {
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

                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-5 text-center space-y-4">
                    <p className="text-sm font-medium text-emerald-400">
                        Pentru a folosi Imobum acum, trimite un mesaj pe WhatsApp
                    </p>
                    <a
                        href="https://wa.me/40748609509?text=Buna,%20vreau%20sa%20ma%20conectez%20rapid%20la%20Imobum"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 border border-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <WhatsAppIcon className="w-5 h-5 shrink-0" />
                        Trimite mesaj pe WhatsApp
                    </a>
                </div>
            </div>
        </div>
    );
}

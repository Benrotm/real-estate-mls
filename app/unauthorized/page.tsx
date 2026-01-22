import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <ShieldAlert className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-3xl font-bold mb-3 text-white">Access Denied</h1>
                <p className="text-slate-400 mb-8 leading-relaxed">
                    You do not have the required permissions to access this area. This incident has been logged.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-4 rounded-xl font-bold hover:from-slate-600 hover:to-slate-700 transition-all shadow-lg border border-slate-600/30"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

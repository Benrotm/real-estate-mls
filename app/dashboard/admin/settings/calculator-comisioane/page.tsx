import { Calculator, ShieldCheck } from 'lucide-react';
import { getUserProfile } from '@/app/lib/auth';
import { getCalculatorSettings } from '@/app/lib/actions/calculator-settings';
import { redirect } from 'next/navigation';
import CalculatorSettingsClient from './CalculatorSettingsClient';

export default async function CalculatorSettingsPage() {
    const profile = await getUserProfile();

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
        redirect('/unauthorized');
    }

    const result = await getCalculatorSettings();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 border-b border-slate-800 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Calculator className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                Calculator Comisioane
                                <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                                    Admin Settings
                                </span>
                            </h1>
                            <p className="text-sm text-slate-400 mt-0.5">
                                Configurează modelele de comisionare, intervalele de valori, perioadele de exclusivitate și serviciile disponibile.
                            </p>
                        </div>
                    </div>
                </header>

                <CalculatorSettingsClient initialSettings={result.settings} />
            </div>
        </div>
    );
}

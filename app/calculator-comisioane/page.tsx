import { Metadata } from 'next';
import { getCalculatorSettings } from '@/app/lib/actions/calculator-settings';
import CalculatorClient from './CalculatorClient';
import { getUserProfile } from '@/app/lib/auth';

export const metadata: Metadata = {
    title: 'Calculator Comisioane & Servicii | Real Estate Hub Timișoara',
    description: 'Calculează instant comisioanele de vânzare sau cumpărare și alege serviciile incluse pentru tranzacții imobiliare transparente în Timișoara.',
    alternates: {
        canonical: '/calculator-comisioane',
    }
};

export default async function CalculatorPage() {
    // Fetch initial settings from DB (with robust server fallbacks)
    const result = await getCalculatorSettings();
    const user = await getUserProfile();
    
    return (
        <main className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 text-center max-w-3xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Calculator Servicii &amp; Comisioane
                    </h1>
                    <p className="text-slate-400 text-base md:text-lg">
                        Real Estate Hub Timișoara — Transparență deplină. Configurează valoarea proprietății, alege modelul de comision și selectează serviciile adăugate pentru a obține o cotație exactă.
                    </p>
                </header>
                
                <CalculatorClient initialSettings={result.settings} user={user} />
            </div>
        </main>
    );
}

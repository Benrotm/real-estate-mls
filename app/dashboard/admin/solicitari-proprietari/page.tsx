import { getCalculatorRequests } from '@/app/lib/actions/calculator-requests';
import CalculatorRequestsClient from './CalculatorRequestsClient';

export const dynamic = 'force-dynamic';

export default async function SolicitariProprietariPage() {
    const { requests } = await getCalculatorRequests();

    return (
        <div className="p-1 md:p-8 min-h-screen bg-slate-950 text-white pt-20">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            Solicitări Proprietari
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">
                            Administrează solicitările proprietarilor trimise prin calculatorul de servicii și comisioane.
                        </p>
                    </div>
                </header>

                <CalculatorRequestsClient initialRequests={requests} />
            </div>
        </div>
    );
}

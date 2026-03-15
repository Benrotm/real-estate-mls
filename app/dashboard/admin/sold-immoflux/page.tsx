import { Target } from 'lucide-react';
import SoldImoFluxClient from './SoldImoFluxClient';
import { getAdminSettings } from '@/app/lib/actions/admin-settings';

export const metadata = {
    title: 'Sold Immoflux Dashboard | Real Estate MLS',
    description: 'Manage automated ingestion of sold properties from Immoflux.',
};

export default async function SoldImoFluxPage() {
    const initialSettings = await getAdminSettings();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Target className="w-8 h-8 text-fuchsia-500" />
                        Sold Immoflux Integration
                    </h1>
                    <p className="text-slate-400 mt-2">Manage settings, mappings, and background tasks for scraping Sold Immoflux properties.</p>
                </header>

                <SoldImoFluxClient initialSettings={initialSettings} />
            </div>
        </div>
    );
}

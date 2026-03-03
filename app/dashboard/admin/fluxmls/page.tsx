import { CopyCheck } from 'lucide-react';
import FluxMLSClient from './FluxMLSClient';
import { getAdminSettings } from '@/app/lib/actions/admin-settings';

export default async function FluxMLSPage() {
    const initialSettings = await getAdminSettings();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <CopyCheck className="w-8 h-8 text-fuchsia-500" />
                        FluxMLS Integration
                    </h1>
                    <p className="text-slate-400 mt-2">Manage settings, mappings, and background tasks specifically for the FluxMLS API integration.</p>
                </header>

                <FluxMLSClient initialSettings={initialSettings} />
            </div>
        </div>
    );
}

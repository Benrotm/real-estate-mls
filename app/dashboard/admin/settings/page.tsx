import { Settings } from 'lucide-react';
import SettingsClient from './SettingsClient';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="w-8 h-8 text-violet-500" />
                        System Settings
                    </h1>
                    <p className="text-slate-400 mt-2">Configure global platform settings, integrations, and intelligent routing.</p>
                </header>

                <SettingsClient />
            </div>
        </div>
    );
}

import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="w-8 h-8 text-purple-500" />
                        System Settings
                    </h1>
                    <p className="text-slate-400 mt-2">Configure global platform settings.</p>
                </header>

                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Global Settings Coming Soon</h3>
                    <p className="text-slate-400">This feature is currently under development.</p>
                </div>
            </div>
        </div>
    );
}

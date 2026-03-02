'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { getAdminSettings, updateAdminSetting, updateProxySetting, AdminSettings, ProxyConfig } from '@/app/lib/actions/admin-settings';

export default function SettingsClient({ initialSettings }: { initialSettings: AdminSettings | null }) {
    const [settings, setSettings] = useState<AdminSettings | null>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Proxy Settings State
    const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
        is_active: false,
        host: '',
        port: '',
        username: '',
        password: '',
    });

    // Initial Load Override
    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getAdminSettings();
            setSettings(data);
            if (data.proxy_integration) {
                setProxyConfig(data.proxy_integration);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleToggle = async (key: keyof AdminSettings) => {
        if (!settings) return;

        const newValue = !settings[key];

        // Optimistic update
        setSettings({ ...settings, [key]: newValue });
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateAdminSetting(key, newValue);

        if (result.success) {
            setMessage({ text: 'Setting updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            // Revert on failure
            setSettings({ ...settings, [key]: !newValue });
            setMessage({ text: `Failed to update: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleSaveProxy = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateProxySetting(proxyConfig);

        if (result.success) {
            setMessage({ text: 'Proxy settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save Proxy settings: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-violet-400" />
                        Assisted Import & Scraper Control
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">
                        Configure the security and intelligence layers for properties imported via external links (OLX, etc).
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Setting 1: Ownership Verification */}
                    <div className="flex items-start justify-between gap-6 group">
                        <div className="flex-1">
                            <label className="text-lg font-bold text-white cursor-pointer group-hover:text-violet-300 transition-colors">
                                Require Ownership Verification
                            </label>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                When enabled, users importing a listing via link must verify ownership via an SMS or Email OTP code before the listing data is populated. This serves as legal protection when extracting data from portals.
                            </p>
                        </div>
                        <button
                            onClick={() => handleToggle('require_ownership_verification')}
                            disabled={isSaving}
                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.require_ownership_verification ? 'bg-violet-500' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.require_ownership_verification ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="h-px bg-slate-800 w-full" />

                    {/* Setting 2: Anti-Duplicate Intelligence */}
                    <div className="flex items-start justify-between gap-6 group">
                        <div className="flex-1">
                            <label className="text-lg font-bold text-white flex items-center gap-2 cursor-pointer group-hover:text-amber-300 transition-colors">
                                Anti-Duplicate Intelligence
                            </label>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                When enabled, the system drops a digital fingerprint on every imported property (Normalizing Address, Price, and Rooms). If a duplicate is detected, the import is allowed but <strong>flagged as a duplicate</strong> for admin review.
                            </p>
                        </div>
                        <button
                            onClick={() => handleToggle('enable_anti_duplicate_intelligence')}
                            disabled={isSaving}
                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.enable_anti_duplicate_intelligence ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.enable_anti_duplicate_intelligence ? 'translate-x-7' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Residential Proxy Settings */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Globe className="w-6 h-6 text-emerald-400" />
                            Residential Proxy API Connectivity
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Route Automated Scraper API traffic through real residential IPs to dramatically bypass Cloudflare/Bot protections.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            const newVal = !proxyConfig.is_active;
                            setProxyConfig({ ...proxyConfig, is_active: newVal });
                            updateProxySetting({ ...proxyConfig, is_active: newVal });
                        }}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${proxyConfig.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proxyConfig.is_active ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Host Endpoint</label>
                            <input
                                type="text"
                                value={proxyConfig.host || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, host: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="brd.superproxy.io"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Port Number</label>
                            <input
                                type="text"
                                value={proxyConfig.port || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, port: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="22225"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Username (Zone ID)</label>
                            <input
                                type="text"
                                value={proxyConfig.username || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, username: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="brd-customer-xxxx-zone-residential"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Proxy Password</label>
                            <input
                                type="password"
                                value={proxyConfig.password || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, password: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleSaveProxy}
                            disabled={isSaving}
                            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Proxy Network config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

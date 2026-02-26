'use client';

import { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CopyCheck, Save, Loader2 } from 'lucide-react';
import { getAdminSettings, updateAdminSetting, updateImmofluxSetting, AdminSettings, ImmofluxConfig } from '@/app/lib/actions/admin-settings';

export default function SettingsClient() {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getAdminSettings();
            setSettings(data);
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

    const handleImmofluxChange = (field: string, value: any, isMapping = false) => {
        if (!settings || !settings.immoflux_integration) return;

        const currentImmo = { ...settings.immoflux_integration };
        if (isMapping) {
            currentImmo.mapping = { ...currentImmo.mapping, [field]: value };
        } else {
            (currentImmo as any)[field] = value;
        }

        setSettings({ ...settings, immoflux_integration: currentImmo });
    };

    const saveImmofluxSettings = async () => {
        if (!settings || !settings.immoflux_integration) return;

        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateImmofluxSetting(settings.immoflux_integration);

        if (result.success) {
            setMessage({ text: 'Immoflux settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save Immoflux setup: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const [isScraping, setIsScraping] = useState(false);

    const runImmofluxScraper = async () => {
        setIsScraping(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/cron/immoflux');
            const data = await res.json();

            if (data.status === 'success') {
                setMessage({ text: `Scrape complete! Found: ${data.found}, Inserted: ${data.inserted}, Skipped Duplicates: ${data.skipped_duplicates}`, type: 'success' });
            } else {
                setMessage({ text: `Scrape issue: ${data.reason}`, type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: `Scraper error: ${error.message}`, type: 'error' });
        } finally {
            setIsScraping(false);
        }
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

            {/* Immoflux Settings Panel */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <CopyCheck className="w-6 h-6 text-blue-400" />
                            Immoflux Integration (Anunturi Particulari)
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Configure the automated scraper logic to ingest private listings directly from your Immoflux account.
                        </p>
                    </div>

                    <button
                        onClick={() => handleImmofluxChange('is_active', !settings?.immoflux_integration?.is_active)}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.immoflux_integration?.is_active ? 'bg-blue-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.immoflux_integration?.is_active ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {settings?.immoflux_integration && (
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
                                    <input
                                        type="text"
                                        value={settings.immoflux_integration.url}
                                        onChange={(e) => handleImmofluxChange('url', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Username / Email</label>
                                        <input
                                            type="text"
                                            value={settings.immoflux_integration.username || ''}
                                            onChange={(e) => handleImmofluxChange('username', e.target.value)}
                                            placeholder="account@immoflux.ro"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            value={settings.immoflux_integration.password || ''}
                                            onChange={(e) => handleImmofluxChange('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Region Filter</label>
                                    <input
                                        type="text"
                                        value={settings.immoflux_integration.region_filter}
                                        onChange={(e) => handleImmofluxChange('region_filter', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Scrape Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={settings.immoflux_integration.scrape_limit || 50}
                                        onChange={(e) => handleImmofluxChange('scrape_limit', parseInt(e.target.value) || 50)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-4">DOM Element Mappings (Cheerio Selectors)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(settings.immoflux_integration.mapping).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{key.replace('_', ' ')}</label>
                                        <input
                                            type="text"
                                            value={value as string}
                                            onChange={(e) => handleImmofluxChange(key, e.target.value, true)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                Last Scraped ID: <strong className="text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded">{settings.immoflux_integration.last_scraped_id || 0}</strong>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={runImmofluxScraper}
                                    disabled={isScraping || isSaving}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-medium transition-all focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50"
                                >
                                    {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isScraping ? 'Scraping...' : 'Run Scraper Now'}
                                </button>
                                <button
                                    onClick={saveImmofluxSettings}
                                    disabled={isSaving || isScraping}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-medium transition-all focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Immoflux Config
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

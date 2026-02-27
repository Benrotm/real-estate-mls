'use client';

import { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CopyCheck, Save, Loader2, Play, Square, Timer } from 'lucide-react';
import { getAdminSettings, updateAdminSetting, updateImmofluxSetting, AdminSettings, ImmofluxConfig } from '@/app/lib/actions/admin-settings';

export default function SettingsClient() {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Historical Auto-Scraper State
    const [isScraping, setIsScraping] = useState(false);
    const [isAutoScraping, setIsAutoScraping] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState(0);

    // Watcher Auto-Scraper State
    const [isWatching, setIsWatching] = useState(false);
    const [isWatcherActive, setIsWatcherActive] = useState(false);
    const [watcherCountdown, setWatcherCountdown] = useState(0);

    useEffect(() => {
        loadSettings();
    }, []);

    // Historical Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAutoScraping) {
            timer = setInterval(() => {
                setAutoCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isScraping) runImmofluxScraper();
                        return (settings?.immoflux_integration?.auto_interval || 10) * 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isAutoScraping, isScraping, settings]);

    // Watcher Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWatcherActive) {
            timer = setInterval(() => {
                setWatcherCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isWatching) runWatcher();
                        return (settings?.immoflux_integration?.watcher_interval_hours || 2) * 3600;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWatcherActive, isWatching, settings]);

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

    const toggleAutoScrape = () => {
        if (!isAutoScraping) {
            setAutoCountdown((settings?.immoflux_integration?.auto_interval || 10) * 60);
            runImmofluxScraper(); // Run first batch immediately
        }
        setIsAutoScraping(!isAutoScraping);
    };

    const runImmofluxScraper = async () => {
        setIsScraping(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/cron/immoflux');
            const data = await res.json();

            if (data.status === 'success') {
                setMessage({ text: `Page ${data.page_completed || ''} scraped! Found: ${data.found}, Inserted: ${data.inserted}. Waiting for next cycle...`, type: 'success' });
            } else if (data.status === 'done') {
                setMessage({ text: `All pages finished! Returning to Page 1 next cycle.`, type: 'success' });
            } else {
                setMessage({ text: `Scrape issue: ${data.reason}`, type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: `Scraper error: ${error.message}`, type: 'error' });
        } finally {
            setIsScraping(false);
        }
    };

    const toggleWatcher = () => {
        if (!isWatcherActive) {
            setWatcherCountdown((settings?.immoflux_integration?.watcher_interval_hours || 2) * 3600);
            runWatcher(); // Run immediate check
        }
        setIsWatcherActive(!isWatcherActive);
    };

    const runWatcher = async () => {
        setIsWatching(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/cron/immoflux?mode=watcher');
            const data = await res.json();

            if (data.status === 'done_watcher') {
                setMessage({ text: `Watcher finished checking. Found ${data.inserted} new properties.`, type: 'success' });
            } else if (data.status === 'success') {
                setMessage({ text: `Watcher fetched 1 page. Inserted: ${data.inserted}.`, type: 'success' });
            } else {
                setMessage({ text: `Watcher issue: ${data.reason}`, type: 'error' });
            }
        } catch (error: any) {
            setMessage({ text: `Watcher error: ${error.message}`, type: 'error' });
        } finally {
            setIsWatching(false);
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
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Scrape Limit (Max per run)</label>
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

                        {/* Anti-Ban Settings Section */}
                        <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>
                            <div className="flex items-center gap-2 mb-4">
                                <Timer className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-lg font-bold text-white">Anti-Ban Settings & Automator</h3>
                            </div>
                            <p className="text-sm text-slate-400 mb-6 max-w-2xl">
                                Configure delays and automated schedules to scrape humanly and avoid IP bans. <strong>Leave this tab open</strong> to keep the automator running.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Delay (sec)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.immoflux_integration.delay_min || 3}
                                        onChange={(e) => handleImmofluxChange('delay_min', parseInt(e.target.value) || 3)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Delay (sec)</label>
                                    <input
                                        type="number"
                                        min="2"
                                        value={settings.immoflux_integration.delay_max || 8}
                                        onChange={(e) => handleImmofluxChange('delay_max', parseInt(e.target.value) || 8)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">History Scrape Interval (min)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.immoflux_integration.auto_interval || 10}
                                            onChange={(e) => handleImmofluxChange('auto_interval', parseInt(e.target.value) || 10)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Watcher Interval (hours)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={settings.immoflux_integration.watcher_interval_hours || 2}
                                            onChange={(e) => handleImmofluxChange('watcher_interval_hours', parseInt(e.target.value) || 2)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                    </div>
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
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-slate-300">Next Page to Scrape:</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={settings.immoflux_integration.last_scraped_id || 1}
                                    onChange={(e) => handleImmofluxChange('last_scraped_id', parseInt(e.target.value) || 1)}
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                                />
                                <span className="text-xs text-slate-500 max-w-[200px] leading-tight">
                                    Automatically increments. Reset to 1 to scan newest properties.
                                </span>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex bg-slate-900 rounded-xl overflow-hidden border border-slate-800 h-10">
                                    {isAutoScraping ? (
                                        <button
                                            onClick={toggleAutoScrape}
                                            className="flex flex-col items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 h-full transition-all min-w-[140px]"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Square className="w-3 h-3 fill-current" /> Stop History
                                            </div>
                                            <div className="text-[10px] text-red-300 tabular-nums">
                                                {isScraping ? 'Paging...' : `Next in ${Math.floor(autoCountdown / 60)}:${(autoCountdown % 60).toString().padStart(2, '0')}`}
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={toggleAutoScrape}
                                            disabled={isScraping || isSaving}
                                            className="flex flex-col items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-4 h-full transition-all min-w-[140px] disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Play className="w-3 h-3 fill-current" /> Loop History
                                            </div>
                                            <div className="text-[10px] text-emerald-300">
                                                Page-by-Page
                                            </div>
                                        </button>
                                    )}

                                    <div className="w-px bg-slate-800 h-full"></div>

                                    {isWatcherActive ? (
                                        <button
                                            onClick={toggleWatcher}
                                            className="flex flex-col items-center justify-center bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-4 h-full transition-all min-w-[140px]"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Square className="w-3 h-3 fill-current" /> Stop Watcher
                                            </div>
                                            <div className="text-[10px] text-violet-300 tabular-nums">
                                                {isWatching ? 'Checking...' : `Next in ${Math.floor(watcherCountdown / 3600)}h ${Math.floor((watcherCountdown % 3600) / 60)}m`}
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={toggleWatcher}
                                            disabled={isWatching || isSaving}
                                            className="flex flex-col items-center justify-center bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-4 h-full transition-all min-w-[140px] disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Play className="w-3 h-3 fill-current" /> Start Watcher
                                            </div>
                                            <div className="text-[10px] text-violet-300">
                                                Newest Only
                                            </div>
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={runImmofluxScraper}
                                    disabled={isScraping || isSaving || isAutoScraping || isWatching}
                                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-slate-500/20 disabled:opacity-50"
                                >
                                    {isScraping && !isAutoScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isScraping && !isAutoScraping ? 'Scraping...' : 'Run Once'}
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

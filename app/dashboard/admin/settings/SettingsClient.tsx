'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings2, UserPlus, Database, CloudFog, Wifi, CheckCircle2, AlertCircle, CopyCheck, RefreshCcw, Save, Loader2, Play, Square, Timer, MapPin, Plus, Edit2, Terminal, ShieldCheck, Globe } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import {
    getAdminSettings,
    updateAdminSetting,
    updateProxySetting,
    updateImmofluxSetting, AdminSettings, ImmofluxConfig, ProxyConfig
} from '@/app/lib/actions/admin-settings';

interface LogMessage {
    id: string;
    message: string;
    log_level: string;
    created_at: string;
}

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

    // Historical Auto-Scraper State
    const [isScraping, setIsScraping] = useState(false);
    const [isAutoScraping, setIsAutoScraping] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState(0);

    // Watcher Auto-Scraper State
    const [isWatching, setIsWatching] = useState(false);
    const [isWatcherActive, setIsWatcherActive] = useState(false);
    const [watcherCountdown, setWatcherCountdown] = useState(0);

    // Terminal State
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Initial Load Override
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
                        if (!isScraping) runImmofluxScraper('history');
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
                        if (!isWatching) runImmofluxScraper('watcher');
                        return (settings?.immoflux_integration?.watcher_interval_hours || 2) * 3600;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWatcherActive, isWatching, settings]);

    // Handle Realtime Terminal Subscription
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        if (!activeJobId) return;

        const logSubscription = supabase
            .channel(`logs-${activeJobId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'scrape_logs', filter: `job_id=eq.${activeJobId}` },
                (payload) => {
                    const newLog = payload.new as LogMessage;
                    setLogs((prev) => [...prev, newLog]);
                }
            )
            .subscribe();

        const jobSubscription = supabase
            .channel(`job-${activeJobId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'scrape_jobs', filter: `id=eq.${activeJobId}` },
                (payload) => {
                    if (payload.new.status === 'completed' || payload.new.status === 'failed') {
                        setIsScraping(false);
                        setIsWatching(false);
                        setStatus(payload.new.status === 'completed' ? 'completed' : 'error');

                        // Increment last scraped ID if it was a history run and succeeded
                        if (payload.new.status === 'completed' && settings?.immoflux_integration && !isWatcherActive && !isWatching) {
                            const updatedConfig = { ...settings.immoflux_integration, last_scraped_id: settings.immoflux_integration.last_scraped_id + 1 };
                            setSettings({ ...settings, immoflux_integration: updatedConfig });
                            updateImmofluxSetting(updatedConfig); // Fire and forget update
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(logSubscription);
            supabase.removeChannel(jobSubscription);
        };
    }, [activeJobId, settings, isWatcherActive, isWatching]);


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

    const toggleAutoScrape = () => {
        if (!isAutoScraping) {
            setAutoCountdown((settings?.immoflux_integration?.auto_interval || 10) * 60);
            runImmofluxScraper(); // Run first batch immediately
        }
        setIsAutoScraping(!isAutoScraping);
    };

    const runImmofluxScraper = async (mode: 'history' | 'watcher' = 'history') => {
        const config = settings?.immoflux_integration;
        if (!config || !config.url) {
            setStatus('error');
            setMessage({ text: 'Please configure and save the Immoflux setup rules first.', type: 'error' });
            return;
        }

        if (mode === 'history') {
            setIsScraping(true);
        } else {
            setIsWatching(true);
        }

        setStatus('running');
        setMessage({ text: `Initializing background ${mode} scraper server...`, type: 'info' });
        setLogs([]);
        setActiveJobId(null);

        try {
            const targetPage = mode === 'watcher' ? 1 : config.last_scraped_id || 1;

            // 1. Create a tracking Job in Supabase
            const { data: jobData, error: jobError } = await supabase
                .from('scrape_jobs')
                .insert({
                    category_url: config.url,
                    status: 'running',
                    pages_to_scrape: 1,
                    delay_ms: (config.delay_min || 3) * 1000
                })
                .select()
                .single();

            if (jobError || !jobData) {
                throw new Error(jobError?.message || 'Failed to create Job Tracking ID.');
            }

            const newJobId = jobData.id;
            setActiveJobId(newJobId);

            setLogs([{ id: 'init', message: `Establishing SECURE link to Immoflux Headless Scraper. Mode: ${mode.toUpperCase()}...`, log_level: 'info', created_at: new Date().toISOString() }]);

            // 2. Call NextJS Server Proxy to inject secure env credentials and trigger Render
            const res = await fetch('/api/admin/start-dynamic-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryUrl: config.url,
                    jobId: newJobId,
                    pageNum: targetPage,
                    delayMin: config.delay_min,
                    delayMax: config.delay_max,
                    mode: mode,
                    linkSelector: 'a', // Immoflux links are standard anchor tags
                    extractSelectors: config.mapping
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to start dynamic scraper');
            }

            setMessage({ text: `Crawler dispatched [Page ${targetPage}]! Listening for live logs...`, type: 'info' });

        } catch (err: any) {
            console.error('Dynamic Import Error:', err);
            setStatus('error');
            if (mode === 'history') setIsScraping(false);
            if (mode === 'watcher') setIsWatching(false);
            setMessage({ text: err.message || 'An unexpected error occurred while starting the crawler.', type: 'error' });
        }
    };

    const handleStopScrape = async () => {
        if (!activeJobId) return;
        try {
            setMessage({ text: 'Transmitting STOP signal to Render Server...', type: 'warning' });
            await supabase
                .from('scrape_jobs')
                .update({ status: 'stopped' })
                .eq('id', activeJobId);

            setLogs((prev) => [...prev, { id: 'halt', message: 'STOP SIGNAL SENT. Waiting for scraper to finish current cycle and exit.', log_level: 'warn', created_at: new Date().toISOString() }]);
            setIsScraping(false);
            setIsWatching(false);
            setStatus('error');
            setMessage({ text: 'Import Halted by User.', type: 'error' });
        } catch (e) {
            console.error(e);
        }
    };

    const getLogColor = (level: string) => {
        switch (level) {
            case 'success': return 'text-green-400 font-bold';
            case 'warn': return 'text-yellow-400';
            case 'error': return 'text-red-400 font-bold';
            default: return 'text-slate-300';
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    const toggleWatcher = () => {
        if (!isWatcherActive) {
            setWatcherCountdown((settings?.immoflux_integration?.watcher_interval_hours || 2) * 3600);
            runImmofluxScraper('watcher'); // Run immediate check
        }
        setIsWatcherActive(!isWatcherActive);
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

                        <div className="pt-6 border-t border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                            <div className="flex items-center gap-3 w-full xl:w-auto">
                                <label className="text-sm font-medium text-slate-300 whitespace-nowrap">Next Page to Scrape:</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={settings.immoflux_integration.last_scraped_id || 1}
                                    onChange={(e) => handleImmofluxChange('last_scraped_id', parseInt(e.target.value) || 1)}
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                                />
                                <span className="text-xs text-slate-500 max-w-[200px] leading-tight hidden md:block">
                                    Automatically increments. Reset to 1 to scan newest properties.
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
                                <div className="flex bg-slate-900 rounded-xl overflow-hidden border border-slate-800 h-10">
                                    {isAutoScraping ? (
                                        <button
                                            onClick={toggleAutoScrape}
                                            className="flex flex-col items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 h-full transition-all"
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
                                            className="flex flex-col items-center justify-center bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 px-4 h-full transition-all disabled:opacity-50"
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
                                            className="flex flex-col items-center justify-center bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-4 h-full transition-all"
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
                                            className="flex flex-col items-center justify-center bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-4 h-full transition-all disabled:opacity-50"
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
                                    onClick={() => runImmofluxScraper('history')}
                                    disabled={isScraping || isSaving || isAutoScraping || isWatching}
                                    className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-slate-500/20 disabled:opacity-50"
                                >
                                    {isScraping && !isAutoScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {isScraping && !isAutoScraping ? 'Scraping...' : 'Run Once'}
                                </button>
                                <button
                                    onClick={saveImmofluxSettings}
                                    disabled={isSaving || isScraping}
                                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Config
                                </button>
                            </div>
                        </div>

                        {/* VISUAL TERMINAL PANEL */}
                        <div className="flex flex-col h-[500px] bg-[#0a0f1c] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-mono text-sm mt-8">
                            {/* Fake Window Header */}
                            <div className="h-10 bg-slate-800/80 border-b border-slate-700 flex items-center px-4 justify-between shrink-0">
                                <div className="flex gap-2 items-center">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-3 text-xs text-slate-400 font-medium flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5" /> Immoflux Render Microservice Output
                                    </span>
                                </div>
                                {activeJobId && (
                                    <span className="text-xs text-emerald-400/80 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded">
                                        ● REALTIME ACTIVE
                                    </span>
                                )}
                            </div>

                            {/* Log Stream */}
                            <div className="flex-1 p-5 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {logs.length === 0 && status === 'idle' && (
                                    <div className="text-slate-500/50 flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center">
                                        <Terminal className="w-12 h-12 mb-3 opacity-20" />
                                        <p>System standing by. Trigger a manual run or Start Loop to view remote logs.</p>
                                    </div>
                                )}

                                {logs.map((log, i) => {
                                    const time = new Date(log.created_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    return (
                                        <div key={log.id + i} className="mb-1.5 flex gap-3 hover:bg-white/5 px-2 -mx-2 rounded py-0.5 transition-colors group">
                                            <span className="text-slate-600 shrink-0 select-none">[{time}]</span>
                                            <span className={`break-words ${getLogColor(log.log_level)}`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    );
                                })}

                                {(isScraping || isWatching) && (
                                    <div className="mt-2 text-indigo-400 animate-pulse">
                                        _
                                    </div>
                                )}
                                <div ref={logsEndRef} />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

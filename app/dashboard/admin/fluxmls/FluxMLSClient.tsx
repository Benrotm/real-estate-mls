'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings2, UserPlus, Database, CloudFog, Wifi, CheckCircle2, AlertCircle, CopyCheck, RefreshCcw, Save, Loader2, Play, Square, Timer, MapPin, Plus, Edit2, Terminal, ShieldCheck, Globe } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { getAdminSettings, updateFluxMLSSetting, AdminSettings, ImmofluxConfig } from '@/app/lib/actions/admin-settings';

interface LogMessage {
    id: string;
    message: string;
    log_level: string;
    created_at: string;
}

export default function FluxMLSClient({ initialSettings }: { initialSettings: AdminSettings | null }) {
    const [settings, setSettings] = useState<AdminSettings | null>(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // FluxMLS Auto-Scraper State
    const [isFluxScraping, setIsFluxScraping] = useState(false);
    const [isFluxAutoScraping, setIsFluxAutoScraping] = useState(false);
    const [fluxAutoCountdown, setFluxAutoCountdown] = useState(0);

    // FluxMLS Watcher State
    const [isFluxWatching, setIsFluxWatching] = useState(false);
    const [isFluxWatcherActive, setIsFluxWatcherActive] = useState(false);
    const [fluxWatcherCountdown, setFluxWatcherCountdown] = useState(0);

    // FluxMLS Terminal State
    const [fluxStatus, setFluxStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [activeFluxJobId, setActiveFluxJobId] = useState<string | null>(null);
    const [fluxLogs, setFluxLogs] = useState<LogMessage[]>([]);
    const fluxLogsEndRef = useRef<HTMLDivElement>(null);

    const getLogColor = (level: string) => {
        switch (level) {
            case 'info': return 'text-blue-400';
            case 'success': return 'text-emerald-400';
            case 'warn': return 'text-amber-400';
            case 'error': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    // FluxMLS Historical Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isFluxAutoScraping) {
            timer = setInterval(() => {
                setFluxAutoCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isFluxScraping) runFluxMLSScraper('history');
                        return (settings?.fluxmls_integration?.auto_interval || 10) * 60;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isFluxAutoScraping, isFluxScraping, settings]);

    // FluxMLS Watcher Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isFluxWatcherActive) {
            timer = setInterval(() => {
                setFluxWatcherCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isFluxWatching) runFluxMLSScraper('watcher');
                        return (settings?.fluxmls_integration?.watcher_interval_hours || 2) * 3600;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isFluxWatcherActive, isFluxWatching, settings]);

    // FluxMLS Terminal Subscriptions
    useEffect(() => {
        fluxLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [fluxLogs]);

    useEffect(() => {
        if (!activeFluxJobId) return;

        const logSubscription = supabase
            .channel(`flux-logs-${activeFluxJobId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'scrape_logs', filter: `job_id=eq.${activeFluxJobId}` },
                (payload) => {
                    const newLog = payload.new as LogMessage;
                    setFluxLogs((prev) => [...prev, newLog]);
                }
            )
            .subscribe();

        const jobSubscription = supabase
            .channel(`flux-job-${activeFluxJobId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'scrape_jobs', filter: `id=eq.${activeFluxJobId}` },
                (payload) => {
                    if (payload.new.status === 'completed' || payload.new.status === 'failed') {
                        setIsFluxScraping(false);
                        setIsFluxWatching(false);
                        setFluxStatus(payload.new.status === 'completed' ? 'completed' : 'error');

                        // Increment last scraped ID if it was a history run and succeeded
                        if (payload.new.status === 'completed' && settings?.fluxmls_integration && !isFluxWatcherActive && !isFluxWatching) {
                            const updatedConfig = { ...settings.fluxmls_integration, last_scraped_id: settings.fluxmls_integration.last_scraped_id + 1 };
                            setSettings({ ...settings, fluxmls_integration: updatedConfig });
                            updateFluxMLSSetting(updatedConfig);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(logSubscription);
            supabase.removeChannel(jobSubscription);
        };
    }, [activeFluxJobId, settings, isFluxWatcherActive, isFluxWatching]);


    const handleFluxMLSChange = (field: string, value: any, isMapping = false) => {
        if (!settings || !settings.fluxmls_integration) return;

        const currentFlux = { ...settings.fluxmls_integration };
        if (isMapping) {
            currentFlux.mapping = { ...currentFlux.mapping, [field]: value };
        } else {
            (currentFlux as any)[field] = value;
        }

        setSettings({ ...settings, fluxmls_integration: currentFlux });
    };

    const saveFluxMLSSettings = async () => {
        if (!settings || !settings.fluxmls_integration) return;

        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateFluxMLSSetting(settings.fluxmls_integration);

        if (result.success) {
            setMessage({ text: 'FluxMLS settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save FluxMLS setup: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const toggleFluxAutoScrape = () => {
        if (!isFluxAutoScraping) {
            setFluxAutoCountdown((settings?.fluxmls_integration?.auto_interval || 10) * 60);
            runFluxMLSScraper(); // Run first batch immediately
        }
        setIsFluxAutoScraping(!isFluxAutoScraping);
    };

    const runFluxMLSScraper = async (mode: 'history' | 'watcher' = 'history') => {
        const config = settings?.fluxmls_integration;
        if (!config || !config.url) {
            setFluxStatus('error');
            setMessage({ text: 'Please configure and save the FluxMLS setup rules first.', type: 'error' });
            return;
        }

        if (mode === 'history') {
            setIsFluxScraping(true);
        } else {
            setIsFluxWatching(true);
        }

        setFluxStatus('running');
        setMessage({ text: `Initializing background ${mode} scraper server...`, type: 'info' });
        setFluxLogs([]);
        setActiveFluxJobId(null);

        try {
            const targetPage = mode === 'watcher' ? 1 : config.last_scraped_id || 1;

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
            setActiveFluxJobId(newJobId);

            setFluxLogs([{ id: 'init', message: `Establishing SECURE link to FluxMLS Headless Scraper. Mode: ${mode.toUpperCase()}...`, log_level: 'info', created_at: new Date().toISOString() }]);

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
                    linkSelector: 'a',
                    extractSelectors: config.mapping,
                    platformUser: config.username,
                    platformPassword: config.password,
                    regionFilter: config.region_filter
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to start dynamic scraper');
            }

            setMessage({ text: `Flux Crawler dispatched [Page ${targetPage}]! Listening for live logs...`, type: 'info' });

        } catch (err: any) {
            console.error('Dynamic Import Error:', err);
            setFluxStatus('error');
            if (mode === 'history') setIsFluxScraping(false);
            if (mode === 'watcher') setIsFluxWatching(false);
            setMessage({ text: err.message || 'An unexpected error occurred while starting the crawler.', type: 'error' });
        }
    };

    const handleFluxStopScrape = async () => {
        if (!activeFluxJobId) return;
        try {
            setMessage({ text: 'Transmitting STOP signal to Render Server...', type: 'warning' });
            await supabase
                .from('scrape_jobs')
                .update({ status: 'stopped' })
                .eq('id', activeFluxJobId);

            setFluxLogs((prev) => [...prev, { id: 'halt', message: 'STOP SIGNAL SENT. Waiting for scraper to finish current cycle and exit.', log_level: 'warn', created_at: new Date().toISOString() }]);
            setIsFluxScraping(false);
            setIsFluxWatching(false);
            setFluxStatus('error');
            setMessage({ text: 'Import Halted by User.', type: 'error' });
        } catch (e) {
            console.error(e);
        }
    };

    const toggleFluxWatcher = () => {
        if (!isFluxWatcherActive) {
            setFluxWatcherCountdown((settings?.fluxmls_integration?.watcher_interval_hours || 2) * 3600);
            runFluxMLSScraper('watcher'); // Run immediate check
        }
        setIsFluxWatcherActive(!isFluxWatcherActive);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin" />
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

            {/* FluxMLS Settings Panel */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <CopyCheck className="w-6 h-6 text-fuchsia-400" />
                            FluxMLS Integration
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Configure the automated scraper logic to ingest private listings directly from your FluxMLS account.
                        </p>
                    </div>

                    <button
                        onClick={() => handleFluxMLSChange('is_active', !settings?.fluxmls_integration?.is_active)}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.fluxmls_integration?.is_active ? 'bg-fuchsia-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.fluxmls_integration?.is_active ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {settings?.fluxmls_integration && (
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
                                    <input
                                        type="text"
                                        value={settings.fluxmls_integration.url}
                                        onChange={(e) => handleFluxMLSChange('url', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Username / Email</label>
                                        <input
                                            type="text"
                                            value={settings.fluxmls_integration.username || ''}
                                            onChange={(e) => handleFluxMLSChange('username', e.target.value)}
                                            placeholder="account@immoflux.ro"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            value={settings.fluxmls_integration.password || ''}
                                            onChange={(e) => handleFluxMLSChange('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Region Filter</label>
                                    <input
                                        type="text"
                                        value={settings.fluxmls_integration.region_filter}
                                        onChange={(e) => handleFluxMLSChange('region_filter', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Scrape Limit (Max per run)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={settings.fluxmls_integration.scrape_limit || 50}
                                        onChange={(e) => handleFluxMLSChange('scrape_limit', parseInt(e.target.value) || 50)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
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
                                        value={settings.fluxmls_integration.delay_min || 3}
                                        onChange={(e) => handleFluxMLSChange('delay_min', parseInt(e.target.value) || 3)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Delay (sec)</label>
                                    <input
                                        type="number"
                                        min="2"
                                        value={settings.fluxmls_integration.delay_max || 8}
                                        onChange={(e) => handleFluxMLSChange('delay_max', parseInt(e.target.value) || 8)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">History Scrape Interval (min)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.fluxmls_integration.auto_interval || 10}
                                            onChange={(e) => handleFluxMLSChange('auto_interval', parseInt(e.target.value) || 10)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Watcher Interval (hours)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={settings.fluxmls_integration.watcher_interval_hours || 2}
                                            onChange={(e) => handleFluxMLSChange('watcher_interval_hours', parseInt(e.target.value) || 2)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-4">DOM Element Mappings (Cheerio Selectors)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {Object.entries(settings.fluxmls_integration.mapping).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{key.replace('_', ' ')}</label>
                                        <input
                                            type="text"
                                            value={value as string}
                                            onChange={(e) => handleFluxMLSChange(key, e.target.value, true)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
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
                                    value={settings.fluxmls_integration.last_scraped_id || 1}
                                    onChange={(e) => handleFluxMLSChange('last_scraped_id', parseInt(e.target.value) || 1)}
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-fuchsia-500 transition-colors text-center"
                                />
                                <span className="text-xs text-slate-500 max-w-[200px] leading-tight hidden md:block">
                                    Automatically increments. Reset to 1 to scan newest properties.
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
                                <div className="flex bg-slate-900 rounded-xl overflow-hidden border border-slate-800 h-10">
                                    {isFluxAutoScraping ? (
                                        <button
                                            onClick={toggleFluxAutoScrape}
                                            className="flex flex-col items-center justify-center bg-red-600/20 text-red-400 hover:bg-red-600/30 px-4 h-full transition-all"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Square className="w-3 h-3 fill-current" /> Stop History
                                            </div>
                                            <div className="text-[10px] text-red-300 tabular-nums">
                                                {isFluxScraping ? 'Paging...' : `Next in ${Math.floor(fluxAutoCountdown / 60)}:${(fluxAutoCountdown % 60).toString().padStart(2, '0')}`}
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={toggleFluxAutoScrape}
                                            disabled={isFluxScraping || isSaving}
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

                                    {isFluxWatcherActive ? (
                                        <button
                                            onClick={toggleFluxWatcher}
                                            className="flex flex-col items-center justify-center bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 px-4 h-full transition-all"
                                        >
                                            <div className="flex items-center gap-1 font-bold text-xs uppercase mb-0.5">
                                                <Square className="w-3 h-3 fill-current" /> Stop Watcher
                                            </div>
                                            <div className="text-[10px] text-violet-300 tabular-nums">
                                                {isFluxWatching ? 'Checking...' : `Next in ${Math.floor(fluxWatcherCountdown / 3600)}h ${Math.floor((fluxWatcherCountdown % 3600) / 60)}m`}
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={toggleFluxWatcher}
                                            disabled={isFluxWatching || isSaving}
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

                                {isFluxScraping && !isFluxAutoScraping ? (
                                    <button
                                        onClick={handleFluxStopScrape}
                                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-red-500/20"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Stop Run
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => runFluxMLSScraper('history')}
                                        disabled={isFluxScraping || isSaving || isFluxAutoScraping || isFluxWatching}
                                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-slate-500/20 disabled:opacity-50"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Run Once
                                    </button>
                                )}
                                <button
                                    onClick={saveFluxMLSSettings}
                                    disabled={isSaving || isFluxScraping}
                                    className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-fuchsia-500/20 disabled:opacity-50"
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
                                        <Terminal className="w-3.5 h-3.5" /> FluxMLS Render Microservice Output
                                    </span>
                                </div>
                                {activeFluxJobId && (
                                    <span className="text-xs text-emerald-400/80 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded">
                                        ● REALTIME ACTIVE
                                    </span>
                                )}
                            </div>

                            {/* Log Stream */}
                            <div className="flex-1 p-5 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {fluxLogs.length === 0 && fluxStatus === 'idle' && (
                                    <div className="text-slate-500/50 flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center">
                                        <Terminal className="w-12 h-12 mb-3 opacity-20" />
                                        <p>System standing by. Trigger a manual run or Start Loop to view remote logs.</p>
                                    </div>
                                )}

                                {fluxLogs.map((log, i) => {
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

                                {(isFluxScraping || isFluxWatching) && (
                                    <div className="mt-2 text-indigo-400 animate-pulse">
                                        _
                                    </div>
                                )}
                                <div ref={fluxLogsEndRef} />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

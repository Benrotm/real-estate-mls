'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings2, UserPlus, Database, CloudFog, Wifi, CheckCircle2, AlertCircle, CopyCheck, RefreshCcw, Save, Loader2, Play, Square, Timer, MapPin, Plus, Edit2, Terminal, ShieldCheck, Globe, Target } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { updateSoldImmofluxSetting, AdminSettings, SoldImmofluxConfig, createScrapeJob } from '@/app/lib/actions/admin-settings';

interface LogMessage {
    id: string;
    message: string;
    log_level: string;
    created_at: string;
}

export default function SoldImoFluxClient({ initialSettings }: { initialSettings: AdminSettings | null }) {
    const [settings, setSettings] = useState<AdminSettings | null>(initialSettings);
    const [isLoading, setIsLoading] = useState(false);
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

    // Terminal State
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Historical Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAutoScraping) {
            timer = setInterval(() => {
                setAutoCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isScraping) runScraper('history');
                        return (settings?.sold_immoflux_integration?.auto_interval || 10) * 60;
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
                        if (!isWatching) runScraper('watcher');
                        return (settings?.sold_immoflux_integration?.watcher_interval_hours || 2) * 3600;
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
                        if (payload.new.status === 'completed' && settings?.sold_immoflux_integration && !isWatcherActive && !isWatching) {
                            const updatedConfig = { ...settings.sold_immoflux_integration, last_scraped_id: settings.sold_immoflux_integration.last_scraped_id + 1 };
                            setSettings({ ...settings, sold_immoflux_integration: updatedConfig });
                            updateSoldImmofluxSetting(updatedConfig);
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

    const handleChange = (field: string, value: any, isMapping = false) => {
        if (!settings || !settings.sold_immoflux_integration) return;

        const currentConfig = { ...settings.sold_immoflux_integration };
        if (isMapping) {
            currentConfig.mapping = { ...currentConfig.mapping, [field]: value };
        } else {
            (currentConfig as any)[field] = value;
        }

        setSettings({ ...settings, sold_immoflux_integration: currentConfig });
    };

    const handleStadiuChange = (value: string) => {
        if (!settings || !settings.sold_immoflux_integration) return;
        const newArray = value.split(',').map(s => s.trim()).filter(s => s !== "");
        handleChange('stadiu_filter', newArray);
    };

    const saveSettings = async () => {
        if (!settings || !settings.sold_immoflux_integration) return;

        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateSoldImmofluxSetting(settings.sold_immoflux_integration);

        if (result.success) {
            setMessage({ text: 'Sold Immoflux settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save setup: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const toggleAutoScrape = () => {
        if (!isAutoScraping) {
            setAutoCountdown((settings?.sold_immoflux_integration?.auto_interval || 10) * 60);
            runScraper('history'); // Run first batch immediately
        }
        setIsAutoScraping(!isAutoScraping);
    };

    const runScraper = async (mode: 'history' | 'watcher' = 'history') => {
        const config = settings?.sold_immoflux_integration;
        if (!config || !config.url) {
            setStatus('error');
            setMessage({ text: 'Please configure and save the Sold Immoflux setup rules first.', type: 'error' });
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

            const result = await createScrapeJob({
                url: config.url,
                delay_ms: (config.delay_min || 3) * 1000,
                pages: 1
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to create Job Tracking ID via server.');
            }

            const newJobId = result.data.id;
            setActiveJobId(newJobId);

            setLogs([{ id: 'init', message: `Establishing SECURE link to Sold Immoflux. Mode: ${mode.toUpperCase()}...`, log_level: 'info', created_at: new Date().toISOString() }]);

            const res = await fetch('/api/admin/start-dynamic-import-sold', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: newJobId,
                    pageNum: targetPage,
                    config: config,
                    mode: mode
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
            setMessage({ text: err.message || 'An unexpected error occurred.', type: 'error' });
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

            setLogs((prev) => [...prev, { id: 'halt', message: 'STOP SIGNAL SENT.', log_level: 'warn', created_at: new Date().toISOString() }]);
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
            setWatcherCountdown((settings?.sold_immoflux_integration?.watcher_interval_hours || 2) * 3600);
            runScraper('watcher');
        }
        setIsWatcherActive(!isWatcherActive);
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

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Target className="w-6 h-6 text-fuchsia-400" />
                            Sold Imoflux Integration
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Configure scraper settings to ingest "Lost - Pierduta" and "Won - Tranzactionata" properties.
                        </p>
                    </div>

                    <button
                        onClick={() => handleChange('is_active', !settings?.sold_immoflux_integration?.is_active)}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.sold_immoflux_integration?.is_active ? 'bg-fuchsia-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.sold_immoflux_integration?.is_active ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                {settings?.sold_immoflux_integration && (
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-800 pb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
                                    <input
                                        type="text"
                                        value={settings.sold_immoflux_integration.url}
                                        onChange={(e) => handleChange('url', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                                        <input
                                            type="text"
                                            value={settings.sold_immoflux_integration.username || ''}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            value={settings.sold_immoflux_integration.password || ''}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Stadiu Filter (comma separated)</label>
                                    <input
                                        type="text"
                                        value={(settings.sold_immoflux_integration.stadiu_filter || []).join(', ')}
                                        onChange={(e) => handleStadiuChange(e.target.value)}
                                        placeholder="Pierduta - Lost, Tranzactionata - Won"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Region Filter</label>
                                        <input
                                            type="text"
                                            value={settings.sold_immoflux_integration.region_filter || ''}
                                            onChange={(e) => handleChange('region_filter', e.target.value)}
                                            placeholder="e.g. Timis"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">City Filter</label>
                                        <input
                                            type="text"
                                            value={settings.sold_immoflux_integration.city_filter || ''}
                                            onChange={(e) => handleChange('city_filter', e.target.value)}
                                            placeholder="Optional"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Zone Filter</label>
                                        <input
                                            type="text"
                                            value={settings.sold_immoflux_integration.zone_filter || ''}
                                            onChange={(e) => handleChange('zone_filter', e.target.value)}
                                            placeholder="Optional"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Scrape Limit</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.sold_immoflux_integration.scrape_limit || 50}
                                            onChange={(e) => handleChange('scrape_limit', parseInt(e.target.value) || 50)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-fuchsia-500 transition-colors"
                                        />
                                    </div>
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
                                Configure delays and automated schedules to scrape humanly and avoid IP bans.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Min Delay (sec)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.sold_immoflux_integration.delay_min || 3}
                                        onChange={(e) => handleChange('delay_min', parseInt(e.target.value) || 3)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Delay (sec)</label>
                                    <input
                                        type="number"
                                        min="2"
                                        value={settings.sold_immoflux_integration.delay_max || 8}
                                        onChange={(e) => handleChange('delay_max', parseInt(e.target.value) || 8)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">History Interval (min)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.sold_immoflux_integration.auto_interval || 10}
                                        onChange={(e) => handleChange('auto_interval', parseInt(e.target.value) || 10)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Watcher Interval (hr)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.sold_immoflux_integration.watcher_interval_hours || 2}
                                        onChange={(e) => handleChange('watcher_interval_hours', parseInt(e.target.value) || 2)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-4">Popup Field Mappings (Labels to extract values by)</label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Object.entries(settings.sold_immoflux_integration.mapping).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">{key.replace('_', ' ')}</label>
                                        <input
                                            type="text"
                                            value={value as string}
                                            onChange={(e) => handleChange(key, e.target.value, true)}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-fuchsia-500 transition-colors font-mono"
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
                                    value={settings.sold_immoflux_integration.last_scraped_id || 1}
                                    onChange={(e) => handleChange('last_scraped_id', parseInt(e.target.value) || 1)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-fuchsia-500 transition-colors text-center"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-start xl:justify-end">
                                {/* Run Actions */}
                                {isScraping && !isAutoScraping ? (
                                    <button
                                        onClick={handleStopScrape}
                                        className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-red-500/20"
                                    >
                                        <Square className="w-4 h-4 fill-current" />
                                        Stop Run
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => runScraper('history')}
                                        disabled={isScraping || isSaving || isAutoScraping || isWatching}
                                        className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-slate-500/20 disabled:opacity-50"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Run Scraper Now
                                    </button>
                                )}
                                <button
                                    onClick={saveSettings}
                                    disabled={isSaving || isScraping}
                                    className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-fuchsia-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Config
                                </button>
                            </div>
                        </div>

                        {/* VISUAL TERMINAL PANEL */}
                        <div className="flex flex-col h-[500px] bg-[#0a0f1c] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-mono text-sm mt-8">
                            <div className="h-10 bg-slate-800/80 border-b border-slate-700 flex items-center px-4 justify-between shrink-0">
                                <div className="flex gap-2 items-center">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-3 text-xs text-slate-400 font-medium flex items-center gap-2">
                                        <Terminal className="w-3.5 h-3.5" /> Sold Immoflux Microservice Output
                                    </span>
                                </div>
                                {activeJobId && (
                                    <span className="text-xs text-emerald-400/80 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded">
                                        ● REALTIME ACTIVE
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 p-5 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {logs.length === 0 && status === 'idle' && (
                                    <div className="text-slate-500/50 flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center">
                                        <Terminal className="w-12 h-12 mb-3 opacity-20" />
                                        <p>System standing by. Trigger a manual run to view remote logs.</p>
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

'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle2, Globe, FileDown, Square, Terminal, Settings2, Save, Timer } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase/client';
import { getAdminSettings, updateOlxSetting, AdminSettings } from '@/app/lib/actions/admin-settings';

interface LogMessage {
    id: string;
    message: string;
    log_level: string;
    created_at: string;
}

export default function BulkImportPage() {
    const [settings, setSettings] = useState<AdminSettings | null>(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Historical Auto-Scraper State
    const [isScraping, setIsScraping] = useState(false);
    const [isAutoScraping, setIsAutoScraping] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState(0);

    // Watcher Auto-Scraper State
    const [isWatching, setIsWatching] = useState(false);
    const [isWatcherActive, setIsWatcherActive] = useState(false);
    const [watcherCountdown, setWatcherCountdown] = useState(0);

    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    // Auto-scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Historical Auto-Scrape interval
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isAutoScraping) {
            timer = setInterval(() => {
                setAutoCountdown((prev) => {
                    if (prev <= 1) {
                        if (!isScraping) runScraper('history');
                        return (settings?.olx_integration?.auto_interval || 10) * 60;
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
                        return (settings?.olx_integration?.watcher_interval_hours || 2) * 3600;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWatcherActive, isWatching, settings]);

    // Handle Realtime Subscription
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
                        setIsLoading(false);
                        setIsScraping(false);
                        setIsWatching(false);
                        setStatus(payload.new.status === 'completed' ? 'completed' : 'error');
                        setMessage({ text: payload.new.status === 'completed' ? 'Extraction run completed successfully!' : 'A critical error crashed the running job.', type: payload.new.status === 'completed' ? 'success' : 'error' });

                        // Increment last scraped ID if it was a history run and succeeded
                        if (payload.new.status === 'completed' && settings?.olx_integration && !isWatcherActive && !isWatching) {
                            const updatedConfig = { ...settings.olx_integration, last_scraped_id: settings.olx_integration.last_scraped_id + 1 };
                            setSettings({ ...settings, olx_integration: updatedConfig });
                            updateOlxSetting(updatedConfig); // Fire and forget update
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
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSettings(false);
        }
    }

    const handleOlxChange = (field: string, value: any) => {
        if (!settings || !settings.olx_integration) return;

        const currentConfig = { ...settings.olx_integration };
        (currentConfig as any)[field] = value;

        setSettings({ ...settings, olx_integration: currentConfig });
    };

    const saveSettings = async () => {
        if (!settings || !settings.olx_integration) return;

        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateOlxSetting(settings.olx_integration);

        if (result.success) {
            setMessage({ text: 'Settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save setup: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const toggleAutoScrape = () => {
        if (!isAutoScraping) {
            setAutoCountdown((settings?.olx_integration?.auto_interval || 10) * 60);
            runScraper('history'); // Run first batch immediately
        }
        setIsAutoScraping(!isAutoScraping);
    };

    const toggleWatcher = () => {
        if (!isWatcherActive) {
            setWatcherCountdown((settings?.olx_integration?.watcher_interval_hours || 2) * 3600);
            runScraper('watcher'); // Run first batch immediately
        }
        setIsWatcherActive(!isWatcherActive);
    };

    const runScraper = async (mode: 'history' | 'watcher' = 'history') => {
        const config = settings?.olx_integration;
        if (!config || !config.category_url) {
            setStatus('error');
            setMessage({ text: 'Please configure and save the OLX setup rules first.', type: 'error' });
            return;
        }

        if (mode === 'history') {
            setIsScraping(true);
        } else {
            setIsWatching(true);
        }

        setIsLoading(true);
        setStatus('running');
        setMessage({ text: `Initializing background ${mode} proxy server...`, type: 'info' });
        setLogs([]);
        setActiveJobId(null);

        try {
            const targetPage = mode === 'watcher' ? 1 : config.last_scraped_id;

            // 1. Create a tracking Job in Supabase
            const { data: jobData, error: jobError } = await supabase
                .from('scrape_jobs')
                .insert({
                    category_url: config.category_url,
                    status: 'running',
                    pages_to_scrape: 1, // Using literal 1, our microservice now extracts 1 page per execution
                    delay_ms: config.delay_min * 1000 // Temporary fallback for legacy column, now using min/max payload
                })
                .select()
                .single();

            if (jobError || !jobData) {
                throw new Error(jobError?.message || 'Failed to create Job Tracking ID.');
            }

            const newJobId = jobData.id;
            setActiveJobId(newJobId);

            setLogs([{ id: 'init', message: `Establishing SECURE link to Render Microservice. Mode: ${mode.toUpperCase()}...`, log_level: 'info', created_at: new Date().toISOString() }]);

            // 2. Call NextJS Server Proxy to inject secure env credentials and trigger Render
            const res = await fetch('/api/admin/start-bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryUrl: config.category_url,
                    jobId: newJobId,
                    pageNum: targetPage,
                    delayMin: config.delay_min,
                    delayMax: config.delay_max,
                    mode: mode
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to start bulk scraper');
            }

            setMessage({ text: `Crawler dispatched [Page ${targetPage}]! Listening for live logs...`, type: 'info' });

        } catch (err: any) {
            console.error('Bulk Import Error:', err);
            setStatus('error');
            setIsLoading(false);
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
            setIsLoading(false);
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

    if (isLoadingSettings) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const config = settings?.olx_integration;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileDown className="w-8 h-8 text-indigo-600" />
                        OLX/Publi24 Automation
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Configure the proxy crawler to safely harvest listings via isolated Render instances.
                    </p>
                </div>
                <Link
                    href="/dashboard/admin/properties"
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                    Back to Listings
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SETTINGS PANEL */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-indigo-500" />
                                <h2 className="font-bold text-slate-900">Crawler Configuration</h2>
                            </div>
                            <button
                                onClick={saveSettings}
                                disabled={isSaving}
                                className="px-4 py-1.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Config
                            </button>
                        </div>

                        {config && (
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Target URL (OLX/Publi24)</label>
                                    <input
                                        type="url"
                                        placeholder="https://www.olx.ro/imobiliare/..."
                                        value={config.category_url}
                                        onChange={(e) => handleOlxChange('category_url', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all text-sm font-medium"
                                        disabled={isLoading || status === 'running'}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Next Page Target</label>
                                        <input
                                            type="number"
                                            value={config.last_scraped_id}
                                            onChange={(e) => handleOlxChange('last_scraped_id', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 transition text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">History Interval (m)</label>
                                        <input
                                            type="number"
                                            value={config.auto_interval}
                                            onChange={(e) => handleOlxChange('auto_interval', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 transition text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Min Delay (s)</label>
                                        <input
                                            type="number"
                                            value={config.delay_min}
                                            onChange={(e) => handleOlxChange('delay_min', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 transition text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Delay (s)</label>
                                        <input
                                            type="number"
                                            value={config.delay_max}
                                            onChange={(e) => handleOlxChange('delay_max', parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 transition text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Watcher Interval (Hours)</label>
                                    <input
                                        type="number"
                                        value={config.watcher_interval_hours}
                                        onChange={(e) => handleOlxChange('watcher_interval_hours', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 transition text-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Checks Page 1 only for newly posted listings.</p>
                                </div>

                                {message.text && (
                                    <div className={`p-4 rounded-xl flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
                                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                                        <div className="text-sm font-medium">{message.text}</div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100 flex flex-col xl:flex-row flex-wrap gap-3">
                                    <button
                                        onClick={() => runScraper('history')}
                                        disabled={isScraping || isWatching}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                                    >
                                        <Play className="w-4 h-4 fill-current" /> Run Next
                                    </button>

                                    <button
                                        onClick={toggleAutoScrape}
                                        disabled={isScraping && !isAutoScraping}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 ${isAutoScraping ? 'bg-rose-500 hover:bg-rose-600' : 'bg-slate-900 hover:bg-slate-800'}`}
                                    >
                                        {isAutoScraping ? (
                                            <><Square className="w-4 h-4 fill-current" /> Stop Loop</>
                                        ) : (
                                            <><Timer className="w-4 h-4" /> Loop History</>
                                        )}
                                    </button>

                                    <button
                                        onClick={toggleWatcher}
                                        disabled={isScraping && !isWatcherActive}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-bold transition-all disabled:opacity-50 ${isWatcherActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                        {isWatcherActive ? (
                                            <><Square className="w-4 h-4 fill-current" /> Stop Watcher</>
                                        ) : (
                                            <><Globe className="w-4 h-4 flex-shrink-0" /> Watcher</>
                                        )}
                                    </button>
                                </div>

                                {/* Active Timers Display */}
                                {(isAutoScraping || isWatcherActive) && (
                                    <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white flex flex-col gap-2 shadow-inner">
                                        <div className="flex items-center gap-2 text-sm font-medium border-b border-slate-700 pb-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                            Automators Active
                                        </div>

                                        {isAutoScraping && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Next History Extract:</span>
                                                <span className="font-mono text-emerald-300 font-bold">{isScraping ? "RUNNING..." : formatTime(autoCountdown)}</span>
                                            </div>
                                        )}

                                        {isWatcherActive && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-400">Next Watcher Extract:</span>
                                                <span className="font-mono text-emerald-300 font-bold">{isWatching ? "RUNNING..." : formatTime(watcherCountdown)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(isWatching || isScraping) && (
                                    <button
                                        type="button"
                                        onClick={handleStopScrape}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-500/30"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        Halt Crawler Microservice
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* VISUAL TERMINAL PANEL */}
                <div className="lg:col-span-7 flex flex-col h-[700px] bg-[#0a0f1c] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-mono text-sm">
                    {/* Fake Window Header */}
                    <div className="h-10 bg-slate-800/80 border-b border-slate-700 flex items-center px-4 justify-between shrink-0">
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="ml-3 text-xs text-slate-400 font-medium flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5" /> Render Microservice Live SSH
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
                                <p>System standing by. Configure proxy and select a deployment mode to view remote proxy logs.</p>
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

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="text-sm text-slate-700">
                    <strong className="block mb-1 text-slate-900">Render Proxy Pipeline Connected</strong>
                    This terminal reads streams directly from the Render.com Virtual Private Server via Supabase WebSockets. Leave this page open in a tab to keep the Automator Loops running actively.
                </div>
            </div>
        </div>
    );
}

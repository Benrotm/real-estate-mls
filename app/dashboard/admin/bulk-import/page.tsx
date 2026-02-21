'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle2, Globe, FileDown, Square, Terminal, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase/client';

interface LogMessage {
    id: string;
    message: string;
    log_level: string;
    created_at: string;
}

export default function BulkImportPage() {
    const [url, setUrl] = useState('');
    const [pagesToScrape, setPagesToScrape] = useState(1);
    const [delayMs, setDelayMs] = useState(12000); // 12 seconds default

    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [logs, setLogs] = useState<LogMessage[]>([]);

    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

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
                        setStatus(payload.new.status === 'completed' ? 'completed' : 'error');
                        setMessage(payload.new.status === 'completed' ? 'Extraction run completed successfully!' : 'A critical error crashed the running job.');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(logSubscription);
            supabase.removeChannel(jobSubscription);
        };
    }, [activeJobId]);


    const handleRunBulkScrape = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url || !url.includes('publi24.ro')) {
            setStatus('error');
            setMessage('Please enter a valid Publi24 category URL.');
            return;
        }

        setIsLoading(true);
        setStatus('running');
        setMessage('Initializing background scraper server...');
        setLogs([]);
        setActiveJobId(null);

        try {
            // 1. Create a tracking Job in Supabase
            const { data: jobData, error: jobError } = await supabase
                .from('scrape_jobs')
                .insert({
                    category_url: url,
                    status: 'running',
                    pages_to_scrape: pagesToScrape,
                    delay_ms: delayMs
                })
                .select()
                .single();

            if (jobError || !jobData) {
                throw new Error(jobError?.message || 'Failed to create Job Tracking ID.');
            }

            const newJobId = jobData.id;
            setActiveJobId(newJobId);

            setLogs([{ id: 'init', message: 'Establishing SECURE link to Render Microservice...', log_level: 'info', created_at: new Date().toISOString() }]);

            // 2. Ping Vercel to ping Render (or ping Render directly)
            const scraperApiBase = process.env.NEXT_PUBLIC_SCRAPER_API_URL || '';
            const runBulkEndpoint = scraperApiBase.replace('/scrape-advanced', '/run-bulk-scrape');
            const webhookUrl = `${window.location.origin}/api/admin/bulk-scrape-item`;

            const res = await fetch(runBulkEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryUrl: url,
                    webhookUrl: webhookUrl,
                    jobId: newJobId,
                    pagesToScrape,
                    delayMs
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to start bulk scraper');
            }

            setMessage(`Crawler dispatched! Listening for live logs on port 5432...`);

        } catch (err: any) {
            console.error('Bulk Import Error:', err);
            setStatus('error');
            setIsLoading(false);
            setMessage(err.message || 'An unexpected error occurred while starting the crawler.');
        }
    };

    const handleStopScrape = async () => {
        if (!activeJobId) return;
        try {
            // Abort the job gracefully
            setMessage('Transmitting STOP signal to Render Server...');
            await supabase
                .from('scrape_jobs')
                .update({ status: 'stopped' })
                .eq('id', activeJobId);

            setLogs((prev) => [...prev, { id: 'halt', message: 'STOP SIGNAL SENT. Waiting for scraper to finish current cycle and exit.', log_level: 'warn', created_at: new Date().toISOString() }]);
            setIsLoading(false);
            setStatus('error');
            setMessage('Import Halted by User.');
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

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileDown className="w-8 h-8 text-indigo-600" />
                        Publi24 Import Terminal
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Deploy an automated microservice crawler to harvest listings while safely evading bot detection.
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
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-indigo-500" />
                            <h2 className="font-bold text-slate-900">Crawler Configuration</h2>
                        </div>

                        <div className="p-6">
                            <form onSubmit={handleRunBulkScrape} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category Page URL</label>
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://www.publi24.ro/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium placeholder-slate-400 bg-slate-50 focus:bg-white text-sm"
                                        disabled={isLoading || status === 'running'}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Depth (Pages)</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            required
                                            value={pagesToScrape}
                                            onChange={(e) => setPagesToScrape(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium bg-slate-50 focus:bg-white text-sm"
                                            disabled={isLoading || status === 'running'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Cycle Delay (ms)</label>
                                        <input
                                            type="number"
                                            min="3000" step="1000"
                                            required
                                            value={delayMs}
                                            onChange={(e) => setDelayMs(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all font-medium bg-slate-50 focus:bg-white text-sm"
                                            disabled={isLoading || status === 'running'}
                                        />
                                    </div>
                                </div>

                                {status === 'completed' && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-emerald-800 font-medium">{message}</div>
                                    </div>
                                )}

                                {status === 'error' && (
                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                        <div className="text-sm text-rose-800 font-medium">{message}</div>
                                    </div>
                                )}

                                {status === 'running' || isLoading ? (
                                    <button
                                        type="button"
                                        onClick={handleStopScrape}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-500/30"
                                    >
                                        <Square className="w-5 h-5 fill-current" />
                                        Halt Crawler Immediately
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!url}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                                    >
                                        <Play className="w-5 h-5 text-indigo-400" />
                                        Engage Automator Deployment
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* VISUAL TERMINAL PANEL */}
                <div className="lg:col-span-7 flex flex-col h-[600px] bg-[#0a0f1c] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden font-mono text-sm">
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
                                <p>System standing by. Enter a URL and engage deployment to view remote proxy logs.</p>
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

                        {status === 'running' && (
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
                    This terminal reads streams directly from the Render.com Virtual Private Server via Supabase WebSockets. You can safely navigate away from this page at any time—the background process will continue indefinitely until the job stops.
                </div>
            </div>
        </div>
    );
}

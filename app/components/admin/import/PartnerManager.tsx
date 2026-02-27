'use client';

import { useState, useEffect } from 'react';
import { ScraperConfig, getScraperConfigs, saveScraperConfig, deleteScraperConfig } from '@/app/lib/actions/scraper-config';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { createPropertyFromData } from '@/app/lib/actions/properties';
import { Plus, Trash2, Save, Play, Globe, Code, CheckCircle, AlertCircle, RefreshCw, X, Wand2, Download } from 'lucide-react';
import SmartMapper from './SmartMapper';
import Link from 'next/link';

export default function PartnerManager() {
    const [configs, setConfigs] = useState<ScraperConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConfig, setSelectedConfig] = useState<ScraperConfig | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Automator Scraper State (Cloned from OLX/Immoflux)
    const [isAutoScraping, setIsAutoScraping] = useState(false);
    const [isWatcherActive, setIsWatcherActive] = useState(false);
    const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
    const [watcherCountdown, setWatcherCountdown] = useState<number | null>(null);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error' | 'stopped'>('idle');
    const [logs, setLogs] = useState<{ time: string; message: string; type: string }[]>([]);
    const [activeJobId, setActiveJobId] = useState<string | null>(null);

    // Smart Mapper State
    const [isSmartMapping, setIsSmartMapping] = useState(false);

    // Test State
    const [testUrl, setTestUrl] = useState('');
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Import State
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccessId, setImportSuccessId] = useState<string | null>(null);

    const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
        setLogs(prev => {
            const newLogs = [{ time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 100);
            return newLogs;
        });
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    // --- AUTOMATOR LOGIC: Supabase Logs Subscription ---
    useEffect(() => {
        if (!activeJobId) return;

        import('@/app/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            const channel = supabase
                .channel(`scrape_logs_${activeJobId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'scrape_logs', filter: `job_id=eq.${activeJobId}` },
                    (payload) => {
                        const newLog = payload.new as { message: string, log_level: string };
                        addLog(newLog.message, (newLog.log_level as 'info' | 'success' | 'warn' | 'error') || 'info');
                    }
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'scrape_jobs', filter: `id=eq.${activeJobId}` },
                    (payload) => {
                        const newJob = payload.new as { status: string };
                        if (newJob.status === 'completed' || newJob.status === 'error' || newJob.status === 'failed' || newJob.status === 'stopped') {
                            setStatus(newJob.status === 'failed' ? 'error' : newJob.status as any);
                            if (newJob.status !== 'stopped') {
                                if (isAutoScraping && selectedConfig?.auto_interval) setAutoCountdown(selectedConfig.auto_interval * 60);
                                if (isWatcherActive && selectedConfig?.watcher_interval_hours) setWatcherCountdown(selectedConfig.watcher_interval_hours * 3600);
                            }
                        }
                    }
                )
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        });
    }, [activeJobId, isAutoScraping, isWatcherActive, selectedConfig]);

    // --- AUTOMATOR LOGIC: Timers ---
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAutoScraping && autoCountdown !== null && status !== 'running') {
            interval = setInterval(() => {
                setAutoCountdown((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) { runDynamicScraper('history'); return null; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isAutoScraping, autoCountdown, status]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isWatcherActive && watcherCountdown !== null && status !== 'running') {
            interval = setInterval(() => {
                setWatcherCountdown((prev) => {
                    if (prev === null) return null;
                    if (prev <= 1) { runDynamicScraper('watcher'); return null; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isWatcherActive, watcherCountdown, status]);

    const runDynamicScraper = async (mode: 'history' | 'watcher') => {
        if (!selectedConfig) return;
        if (!selectedConfig.category_url || !selectedConfig.link_selector) {
            addLog('Error: Cannot run Automator. Missing Category URL or Link Selector!', 'error');
            return;
        }

        setStatus('running');
        const jobId = `dyn-${Date.now()}`;
        setActiveJobId(jobId);
        setLogs([]);
        addLog(`Initializing Dynamic Scraper [${mode.toUpperCase()}] for ${selectedConfig.name}...`, 'info');

        try {
            import('@/app/lib/supabase/client').then(async ({ createClient }) => {
                const supabase = createClient();
                await supabase.from('scrape_jobs').insert({
                    id: jobId, provider: `dynamic_${selectedConfig.name}`, status: 'running',
                    parameters: { mode }
                });
            });

            // For History mode, loop last known page. For Watcher, ALWAYS page 1.
            const pageNum = mode === 'history' ? (selectedConfig.last_scraped_id || 1) : 1;

            const res = await fetch('/api/admin/start-dynamic-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryUrl: selectedConfig.category_url,
                    linkSelector: selectedConfig.link_selector,
                    extractSelectors: selectedConfig.selectors,
                    pageNum,
                    delayMin: selectedConfig.delay_min || 5,
                    delayMax: selectedConfig.delay_max || 15,
                    mode,
                    jobId
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            addLog('Dynamic Crawler task pushed to Render.com successfully.', 'success');

            // Immediately increment history page logic directly from UI
            if (mode === 'history') {
                setSelectedConfig({ ...selectedConfig, last_scraped_id: pageNum + 1 });
                // We'll let `handleSave` or auto-save push this to DB later
            }

        } catch (error: any) {
            addLog(`Failed to start job: ${error.message}`, 'error');
            setStatus('error');
            if (mode === 'history') setAutoCountdown(5 * 60);
            if (mode === 'watcher') setWatcherCountdown(5 * 60);
        }
    };

    const handleStopScrape = async () => {
        if (!activeJobId) return;
        addLog('Sending abort signal to Render microservice...', 'warn');
        try {
            const { createClient } = await import('@/app/lib/supabase/client');
            const supabase = createClient();
            await supabase.from('scrape_jobs').update({ status: 'stopped' }).eq('id', activeJobId);
            setStatus('stopped');
            setIsAutoScraping(false);
            setIsWatcherActive(false);
            setAutoCountdown(null);
            setWatcherCountdown(null);
            addLog('Scraper aborted successfully.', 'info');
        } catch (e) {
            addLog('Failed to abort scraper.', 'error');
        }
    };

    const toggleAutoScrape = () => {
        if (isAutoScraping) {
            setIsAutoScraping(false);
            setAutoCountdown(null);
            if (status === 'running') handleStopScrape();
        } else {
            setIsAutoScraping(true);
            setIsWatcherActive(false);
            runDynamicScraper('history');
        }
    };

    const toggleWatcher = () => {
        if (isWatcherActive) {
            setIsWatcherActive(false);
            setWatcherCountdown(null);
            if (status === 'running') handleStopScrape();
        } else {
            setIsWatcherActive(true);
            setIsAutoScraping(false);
            runDynamicScraper('watcher');
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const loadConfigs = async () => {
        setIsLoading(true);
        const data = await getScraperConfigs();
        setConfigs(data);
        setIsLoading(false);
    };

    const DEFAULT_SELECTORS = {
        title: '', price: '', currency: '', description: '', type: '', listing_type: '',
        location: '', location_county: '', location_city: '', location_area: '',
        rooms: '', bedrooms: '', bathrooms: '',
        area: '', area_usable: '', area_built: '', area_terrace: '', area_garden: '',
        floor: '', total_floors: '', year_built: '',
        partitioning: '', comfort: '',
        building_type: '', interior_condition: '', furnishing: '',
        owner_name: '', owner_phone: '', private_notes: '',
        features: '', images: '', video_url: '', virtual_tour_url: ''
    };

    const handleAddNew = () => {
        const newConfig: ScraperConfig = {
            id: '',
            name: 'New Partner',
            domain: 'example.com',
            selectors: { ...DEFAULT_SELECTORS },
            isActive: true
        };
        setSelectedConfig(newConfig);
        setIsEditing(true);
        setIsSmartMapping(false);
        setTestResult(null);
        setTestUrl('');
        setImportSuccessId(null);
    };

    const handleEdit = (config: ScraperConfig) => {
        // Merge with defaults to ensure all fields are present even if DB has old data
        setSelectedConfig({
            ...config,
            selectors: { ...DEFAULT_SELECTORS, ...config.selectors }
        });
        setIsEditing(true);
        setIsSmartMapping(false);
        setTestResult(null);
        setTestUrl('');
        setImportSuccessId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this partner configuration?')) return;
        await deleteScraperConfig(id);
        loadConfigs();
        if (selectedConfig?.id === id) {
            setSelectedConfig(null);
            setIsEditing(false);
        }
    };

    const handleSave = async () => {
        if (!selectedConfig) return;
        const res = await saveScraperConfig(selectedConfig);
        if (res.success) {
            loadConfigs();
            setIsEditing(false);
            setSelectedConfig(res.data || null);
        } else {
            alert('Failed to save: ' + res.message);
        }
    };

    const handleSmartMapSave = (newSelectors: ScraperConfig['selectors']) => {
        if (!selectedConfig) return;
        setSelectedConfig({ ...selectedConfig, selectors: newSelectors });
        setIsSmartMapping(false);
        // We don't auto-save to DB here, allowing user to review in the main form first.
    };

    const handleTestScrape = async () => {
        if (!testUrl || !selectedConfig) return;

        setIsTesting(true);
        setTestResult(null);
        setImportSuccessId(null);

        // We need to implement a way to pass the selectors to the scraper
        // For now, we simulate testing by passing the url and hypothetically applying the selectors
        // In a real implementation, we would modify scrapeProperty to accept `customSelectors`

        try {
            // NOTE: This call currently uses the DEFAULT scraper logic.
            // TODO: Update scrapeProperty to accept config override.
            const result = await scrapeProperty(testUrl, selectedConfig.selectors as any);
            setTestResult(result);
        } catch (error: any) {
            setTestResult({ error: error.message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleImportConfig = async () => {
        if (!testResult?.data) return;

        setIsImporting(true);
        try {
            const res = await createPropertyFromData(
                testResult.data,
                testUrl // Pass URL as second argument
            );
            if (res.success && res.data) {
                setImportSuccessId(res.data.id);
            } else {
                alert('Import failed: ' + res.error);
            }
        } catch (error: any) {
            alert('Import error: ' + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const updateSelector = (field: keyof ScraperConfig['selectors'], value: string) => {
        if (!selectedConfig) return;
        setSelectedConfig({
            ...selectedConfig,
            selectors: { ...selectedConfig.selectors, [field]: value }
        });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading configurations...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Smart Mapper Modal Overlay */}
            {isSmartMapping && selectedConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <SmartMapper
                        config={selectedConfig}
                        onSave={handleSmartMapSave}
                        onCancel={() => setIsSmartMapping(false)}
                    />
                </div>
            )}

            {/* List Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Partners</h2>
                    <button onClick={handleAddNew} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    {configs.map(config => (
                        <div
                            key={config.id}
                            onClick={() => handleEdit(config)}
                            className={`p-4 rounded-xl border cursor-pointer transition flex justify-between items-center ${selectedConfig?.id === config.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-white'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{config.name}</h3>
                                    <p className="text-xs text-slate-500">{config.domain}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </div>
                        </div>
                    ))}

                    {configs.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                            No partners configured. Add one to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Configurator */}
            <div className="lg:col-span-2">
                {isEditing && selectedConfig ? (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Configure Scraper</h3>
                            <div className="flex items-center gap-2">
                                {selectedConfig.id && (
                                    <button onClick={() => handleDelete(selectedConfig.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Close">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* General Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Partner Name</label>
                                    <input
                                        type="text"
                                        value={selectedConfig.name}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, name: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-900"
                                        placeholder="e.g. PropertyLab"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Domain</label>
                                    <input
                                        type="text"
                                        value={selectedConfig.domain}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, domain: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm text-slate-900"
                                        placeholder="propertylab.ro"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Selectors Grid Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-purple-600" />
                                    <h4 className="font-bold text-slate-900">CSS Selectors Mapping</h4>
                                </div>
                                <button
                                    onClick={() => setIsSmartMapping(true)}
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-bold hover:bg-indigo-100 transition flex items-center gap-2"
                                >
                                    <Wand2 className="w-3 h-3" />
                                    Smart Map
                                </button>
                            </div>

                            {/* Selectors Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.keys(selectedConfig.selectors).map((key) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{key}</label>
                                        <input
                                            type="text"
                                            value={(selectedConfig.selectors as any)[key]}
                                            onChange={(e) => updateSelector(key as any, e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono text-blue-600 bg-slate-50"
                                            placeholder={`.${key}-class`}
                                        />
                                    </div>
                                ))}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Automator Settings Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-600" />
                                    <h4 className="font-bold text-slate-900">Dynamic Crawler (Automator)</h4>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Index URL (w/ Page Param)</label>
                                    <input
                                        type="url"
                                        value={selectedConfig.category_url || ''}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, category_url: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-emerald-50 text-emerald-900"
                                        placeholder="https://example.com/listings?page="
                                    />
                                    <span className="text-[10px] text-slate-400">Must end with the page query (e.g., `?page=`)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Link Selector</label>
                                        <input
                                            type="text"
                                            value={selectedConfig.link_selector || ''}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, link_selector: e.target.value })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-emerald-50 text-emerald-900 font-mono"
                                            placeholder=".property-card a"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Next Page ID</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={selectedConfig.last_scraped_id || 1}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, last_scraped_id: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-blue-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Min Delay (s)</label>
                                        <input
                                            type="number"
                                            value={selectedConfig.delay_min || 5}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, delay_min: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Max Delay (s)</label>
                                        <input
                                            type="number"
                                            value={selectedConfig.delay_max || 15}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, delay_max: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Loop Dist (min)</label>
                                        <input
                                            type="number"
                                            value={selectedConfig.auto_interval || 15}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, auto_interval: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Watcher Rate (h)</label>
                                        <input
                                            type="number"
                                            value={selectedConfig.watcher_interval_hours || 4}
                                            onChange={(e) => setSelectedConfig({ ...selectedConfig, watcher_interval_hours: parseInt(e.target.value) })}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Automator Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Auto-Loop Card */}
                                <div className={`p-4 rounded-xl border-2 transition-all ${isAutoScraping ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-bold ${isAutoScraping ? 'text-blue-700' : 'text-slate-800'}`}>Loop History</h3>
                                            <p className="text-xs text-slate-500">Crawls sequentially page by page</p>
                                        </div>
                                        <button
                                            onClick={toggleAutoScrape}
                                            className={`w-10 h-6 rounded-full transition-colors relative ${isAutoScraping ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            disabled={isWatcherActive || !selectedConfig.id}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isAutoScraping ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {isAutoScraping && (
                                        <div className="mt-3 py-2 px-3 bg-white rounded-lg border border-blue-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {status === 'running' ? (
                                                    <><RefreshCw className="w-4 h-4 text-blue-500 animate-spin" /><span className="text-xs font-bold text-blue-700">SCRAPING PAGE {selectedConfig.last_scraped_id}...</span></>
                                                ) : (
                                                    <><RefreshCw className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-600">WAITING</span></>
                                                )}
                                            </div>
                                            {status !== 'running' && autoCountdown !== null && (
                                                <div className="text-xs font-mono font-bold text-blue-600">{formatTime(autoCountdown)}</div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Watcher Card */}
                                <div className={`p-4 rounded-xl border-2 transition-all ${isWatcherActive ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-bold ${isWatcherActive ? 'text-purple-700' : 'text-slate-800'}`}>Start Watcher</h3>
                                            <p className="text-xs text-slate-500">Watches page 1 for new properties</p>
                                        </div>
                                        <button
                                            onClick={toggleWatcher}
                                            className={`w-10 h-6 rounded-full transition-colors relative ${isWatcherActive ? 'bg-purple-600' : 'bg-slate-300'}`}
                                            disabled={isAutoScraping || !selectedConfig.id}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isWatcherActive ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {isWatcherActive && (
                                        <div className="mt-3 py-2 px-3 bg-white rounded-lg border border-purple-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {status === 'running' ? (
                                                    <><RefreshCw className="w-4 h-4 text-purple-500 animate-spin" /><span className="text-xs font-bold text-purple-700">SCANNING P1...</span></>
                                                ) : (
                                                    <><RefreshCw className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-600">WAITING</span></>
                                                )}
                                            </div>
                                            {status !== 'running' && watcherCountdown !== null && (
                                                <div className="text-xs font-mono font-bold text-purple-600">{formatTime(watcherCountdown)}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Terminal Console */}
                            <div className="bg-[#0D1117] rounded-xl overflow-hidden shadow-inner border border-slate-800">
                                <div className="bg-[#161B22] px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                                    <span className="text-xs font-mono text-slate-400">root@scraper-api-microservice:~</span>
                                    {status === 'running' && (
                                        <button onClick={handleStopScrape} className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-400/10 rounded">
                                            SIGTERM
                                        </button>
                                    )}
                                </div>
                                <div className="p-4 h-48 overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                                    {logs.length === 0 ? (
                                        <div className="text-slate-500 italic">Waiting for connection to Render.com microservice...</div>
                                    ) : (
                                        logs.map((log, i) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                                                <span className={
                                                    log.type === 'error' ? 'text-red-400' :
                                                        log.type === 'success' ? 'text-green-400' :
                                                            log.type === 'warn' ? 'text-yellow-400' : 'text-slate-300'
                                                }>
                                                    {log.message}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                    {status === 'running' && (
                                        <div className="flex gap-3 animate-pulse">
                                            <span className="text-slate-500 text-transparent opacity-0">[00:00:00]</span>
                                            <span className="text-emerald-400">_</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Testing Section */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-bold text-slate-900 mb-2 text-sm">Test Configuration</h4>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="url"
                                        value={testUrl}
                                        onChange={(e) => setTestUrl(e.target.value)}
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm text-slate-900"
                                        placeholder={`Paste a URL from ${selectedConfig.domain || 'the target site'}...`}
                                    />
                                    <button
                                        onClick={handleTestScrape}
                                        disabled={isTesting || !testUrl}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-3 h-3" />}
                                        Test Scrape
                                    </button>
                                </div>

                                {testResult && (
                                    <div className="bg-white rounded-lg border border-slate-200 p-4 text-xs overflow-auto max-h-60">
                                        {testResult.error ? (
                                            <div className="text-red-600 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                {testResult.error}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-green-600 font-bold">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Scrape Successful
                                                    </div>

                                                    {/* IMPORT ACTION */}
                                                    {importSuccessId ? (
                                                        <Link
                                                            href={`/dashboard/admin/properties/${importSuccessId}/edit`}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-md font-bold hover:bg-green-200 transition"
                                                        >
                                                            <CheckCircle className="w-3 h-3" />
                                                            Imported! View Property
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={handleImportConfig}
                                                            disabled={isImporting}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md font-bold hover:bg-purple-700 transition disabled:opacity-50"
                                                        >
                                                            {isImporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                            Import Listing
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="max-h-60 overflow-auto border-t border-slate-100 pt-2 space-y-1">
                                                    {Object.entries(testResult.data || {}).map(([k, v]) => (
                                                        <div key={k} className="grid grid-cols-3 gap-2 border-b border-slate-50 py-1">
                                                            <span className="font-bold text-slate-500">{k}</span>
                                                            <span className="col-span-2 font-mono text-slate-800 truncate" title={String(v)}>
                                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Configuration
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <Globe className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a partner to configure or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

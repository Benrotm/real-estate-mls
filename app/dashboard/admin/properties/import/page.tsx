'use client';

import { useState, useEffect, useRef } from 'react';
import { scrapeOlx, scrapePubli24, importFromApi, getImportSettings, saveImportSettings, ImportResult, ImportSettings } from '@/app/lib/actions/import';
import { createPropertyFromData } from '@/app/lib/actions/properties';
import { getPubli24Links } from '@/app/lib/actions/bulk-import';
import { scrapeProperty, ScrapedProperty } from '@/app/lib/actions/scrape';
import { getScraperConfigs } from '@/app/lib/actions/scraper-config';
import { Globe, Database, Loader2, Play, CheckCircle, AlertCircle, ArrowLeft, Settings, Save, LayoutGrid, Upload, FileSpreadsheet, Layers, Download, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImportPropertiesModal from '@/app/components/properties/ImportPropertiesModal';
import PartnerManager from '@/app/components/admin/import/PartnerManager';

export default function ImportPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'runner' | 'settings' | 'partners'>('runner');
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, ImportResult | null>>({
        olx: null,
        publi24: null,
        api: null
    });

    // Modal State
    const [showImportModal, setShowImportModal] = useState(false);

    // Bulk Import Logic
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkUrl, setBulkUrl] = useState('');
    const [bulkLimit, setBulkLimit] = useState(1);
    const [bulkLogs, setBulkLogs] = useState<{ message: string; type: 'info' | 'success' | 'error' }[]>([]);
    const [isBulkImporting, setIsBulkImporting] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [bulkLogs]);

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setBulkLogs(prev => [...prev, { message, type }]);
    };

    const handleBulkImport = async () => {
        if (!bulkUrl) return;
        if (!bulkUrl.includes('publi24.ro')) {
            alert('Currently only Publi24 is supported for bulk import.');
            return;
        }

        setIsBulkImporting(true);
        setBulkLogs([]);
        addLog(`Starting bulk import for: ${bulkUrl}`, 'info');

        try {
            // Fetch configuration to get selectors
            // We assume there is a config with domain 'publi24.ro' or we use default if not found (though scraping needs selectors)
            // Ideally we should let user select, but for now we auto-select the first matching domain
            const configs = await getScraperConfigs();
            const config = configs.find(c => c.domain.includes('publi24.ro') || c.name.toLowerCase().includes('publi24'));

            if (!config) {
                addLog('Error: No Scraper Configuration found for Publi24. Please configure it in the Partners tab first.', 'error');
                setIsBulkImporting(false);
                return;
            }

            let totalImported = 0;
            let totalFailed = 0;

            for (let page = 1; page <= bulkLimit; page++) {
                addLog(`Fetching page ${page}...`, 'info');

                const res = await getPubli24Links(bulkUrl, page);

                if (!res.success) {
                    addLog(`Failed to fetch page ${page}: ${res.error}`, 'error');
                    continue;
                }

                const links = res.links || [];
                addLog(`Found ${links.length} listings on page ${page}.`, 'info');

                for (const link of links) {
                    addLog(`Scraping: ${link}`, 'info');

                    try {
                        // 1. Scrape
                        const scrapeRes = await scrapeProperty(link, config.selectors as any);

                        if (scrapeRes.error || !scrapeRes.data) {
                            addLog(`Scrape failed: ${scrapeRes.error}`, 'error');
                            totalFailed++;
                            continue;
                        }

                        // 2. Import
                        const importRes = await createPropertyFromData({
                            ...scrapeRes.data,
                            type: (scrapeRes.data.type || 'Apartment') as any,
                            listing_type: (scrapeRes.data.listing_type === 'rent' ? 'For Rent' : 'For Sale') as any,
                            currency: (scrapeRes.data.currency === 'USD' || scrapeRes.data.currency === 'RON' ? scrapeRes.data.currency : 'EUR') as any,
                        }, link);

                        if (importRes.success) {
                            addLog(`Imported: ${scrapeRes.data.title?.substring(0, 30)}...`, 'success');
                            totalImported++;
                        } else {
                            addLog(`Import failed: ${importRes.error}`, 'error');
                            totalFailed++;
                        }

                    } catch (err: any) {
                        addLog(`Error processing ${link}: ${err.message}`, 'error');
                        totalFailed++;
                    }

                    // Small delay to be nice
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            addLog(`Bulk Import Completed! Imported: ${totalImported}, Failed: ${totalFailed}`, 'success');

        } catch (error: any) {
            addLog(`Critical Error: ${error.message}`, 'error');
        } finally {
            setIsBulkImporting(false);
        }
    };


    const handleScrapeSuccess = async (data: ScrapedProperty) => {
        // Save as draft property then redirect
        try {
            const res = await createPropertyFromData({
                title: data.title,
                description: data.description,
                price: data.price,
                currency: (data.currency === 'USD' || data.currency === 'RON' ? data.currency : 'EUR') as any,
                images: data.images,
                address: data.address,
                type: (data.type || 'Apartment') as any,
                listing_type: (data.listing_type === 'rent' ? 'For Rent' : 'For Sale') as any,
            }, data.url);

            if (res.success && res.data) {
                // Redirect to edit page
                router.push(`/dashboard/admin/properties/${res.data.id}/edit`);
            } else {
                console.error('Failed to save scraped property:', res.error);
                throw new Error(res.error || 'Failed to save property draft');
            }
        } catch (error) {
            console.error('Error in handleScrapeSuccess:', error);
            throw error; // Re-throw to be caught by the modal
        }
    };

    // Settings State
    const [settings, setSettings] = useState<ImportSettings>({
        apiUrl: '',
        apiKey: '',
        enableOlx: true,
        enablePubli24: true,
        scrapeFrequency: 'daily'
    });
    const [settingsStatus, setSettingsStatus] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        // Load settings on mount
        getImportSettings().then(setSettings);
    }, []);

    const handleAction = async (key: string, action: () => Promise<ImportResult>) => {
        setIsLoading(key);
        try {
            const result = await action();
            setResults(prev => ({ ...prev, [key]: result }));
        } catch (error: any) {
            setResults(prev => ({ ...prev, [key]: { success: false, message: 'Unexpected Error', details: error.message } }));
        } finally {
            setIsLoading(null);
        }
    };

    const handleSaveSettings = async () => {
        setIsLoading('save_settings');
        setSettingsStatus(null);
        try {
            const result = await saveImportSettings(settings);
            setSettingsStatus(result);
        } catch (error: any) {
            setSettingsStatus({ success: false, message: 'Failed to save settings' });
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <ImportPropertiesModal
                showDefaultButton={false}
                forceOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onScrapeSuccess={handleScrapeSuccess}
            />

            <div className="mb-8">
                <Link href="/dashboard/admin/properties" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4" /> Back to All Properties
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Property Import & Scraping</h1>
                        <p className="text-slate-500">Manage automated listing imports from external sources.</p>
                    </div>
                    {/* Tab Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('runner')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'runner' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" /> Run Imports
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'settings' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Settings className="w-4 h-4" /> Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('partners')}
                            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'partners' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Globe className="w-4 h-4" /> Partners
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'runner' ? (
                /* RUNNER VIEW */
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Manual / Bulk Import Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Upload className="w-24 h-24" />
                            </div>
                            <div className="flex items-center gap-4 mb-4 relative z-10">
                                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Raw Import</h3>
                                    <p className="text-xs text-slate-500">CSV, Link, XML</p>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm mb-6 flex-1 relative z-10">
                                Upload CSV files, scrape individual links, or sync via XML/CRM feeds.
                            </p>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 relative z-10"
                            >
                                <Upload className="w-4 h-4" />
                                Open Importer
                            </button>
                        </div>

                        {/* OLX Scraper Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">OLX.ro</h3>
                                    <p className="text-xs text-slate-500">Scraper Integration</p>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm mb-6 flex-1">
                                Run the daily scraper for OLX listings in the Timisoara region.
                            </p>
                            {!settings.enableOlx && (
                                <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Disabled in Settings
                                </div>
                            )}
                            {results.olx && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${results.olx.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="font-bold flex items-center gap-2">
                                        {results.olx.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        {results.olx.message}
                                    </div>
                                    <div className="mt-1 text-xs opacity-90">{results.olx.details}</div>
                                </div>
                            )}
                            <button
                                onClick={() => handleAction('olx', scrapeOlx)}
                                disabled={!!isLoading || !settings.enableOlx}
                                className="w-full py-2.5 px-4 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading === 'olx' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                {isLoading === 'olx' ? 'Running...' : 'Run Scraper'}
                            </button>
                        </div>

                        {/* Publi24 Scraper Card */}
                        <div className={`bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col transition-all duration-300 ${showBulkImport ? 'md:col-span-2 row-span-2' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                        <Globe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">Publi24.ro</h3>
                                        <p className="text-xs text-slate-500">Scraper Integration</p>
                                    </div>
                                </div>
                                {showBulkImport && (
                                    <button
                                        onClick={() => setShowBulkImport(false)}
                                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {!showBulkImport ? (
                                <>
                                    <p className="text-slate-600 text-sm mb-6 flex-1">
                                        Run the daily scraper for Publi24 listings or perform a bulk import from a category.
                                    </p>
                                    {!settings.enablePubli24 && (
                                        <div className="mb-4 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-100 flex items-center gap-2">
                                            <AlertCircle className="w-3 h-3" /> Disabled in Settings
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2 mt-auto">
                                        <button
                                            onClick={() => setShowBulkImport(true)}
                                            disabled={!settings.enablePubli24}
                                            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Layers className="w-4 h-4" />
                                            Open Bulk Importer
                                        </button>
                                        <button
                                            onClick={() => handleAction('publi24', scrapePubli24)}
                                            disabled={!!isLoading || !settings.enablePubli24}
                                            className="w-full py-2 px-4 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-4 h-4" />
                                            Run Daily Scraper
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                                        <h4 className="font-bold mb-1 flex items-center gap-2">
                                            <Layers className="w-4 h-4" /> Bulk Import
                                        </h4>
                                        <p className="opacity-90">
                                            Enter a Publi24 category URL to scrape multiple listings securely.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Category URL</label>
                                            <input
                                                type="url"
                                                value={bulkUrl}
                                                onChange={(e) => setBulkUrl(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="https://www.publi24.ro/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Pages</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={5}
                                                value={bulkLimit}
                                                onChange={(e) => setBulkLimit(Number(e.target.value))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBulkImport}
                                        disabled={isBulkImporting || !bulkUrl}
                                        className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isBulkImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        {isBulkImporting ? 'Importing...' : 'Start Import'}
                                    </button>

                                    {/* Logs Area */}
                                    <div className="bg-slate-900 rounded-lg p-3 h-48 overflow-auto font-mono text-xs border border-slate-800">
                                        <div className="flex items-center justify-between mb-2 text-slate-500 border-b border-slate-800 pb-1">
                                            <span className="font-bold uppercase tracking-wider text-[10px]">Console Log</span>
                                            {isBulkImporting && <span className="text-green-500 animate-pulse">● Live</span>}
                                        </div>
                                        <div className="space-y-1">
                                            {bulkLogs.length === 0 && (
                                                <div className="text-slate-600 italic">Logs will appear here...</div>
                                            )}
                                            {bulkLogs.map((log, i) => (
                                                <div key={i} className={
                                                    log.type === 'error' ? 'text-red-400' :
                                                        log.type === 'success' ? 'text-green-400' : 'text-slate-300'
                                                }>
                                                    <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                                    {log.message}
                                                </div>
                                            ))}
                                            <div ref={logsEndRef} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Centralized API Card */}
                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Centralized API</h3>
                                    <p className="text-xs text-slate-500">Paid Service Integration</p>
                                </div>
                            </div>
                            <p className="text-slate-600 text-sm mb-6 flex-1">
                                Import verified listings from the centralized database service.
                            </p>
                            {(!settings.apiUrl || !settings.apiKey) && (
                                <div className="mb-4 p-2 bg-red-50 text-red-800 text-xs rounded border border-red-100 flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Missing Config
                                </div>
                            )}
                            {results.api && (
                                <div className={`mb-4 p-3 rounded-lg text-sm ${results.api.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    <div className="font-bold flex items-center gap-2">
                                        {results.api.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        {results.api.message}
                                    </div>
                                    <div className="mt-1 text-xs opacity-90">{results.api.details}</div>
                                </div>
                            )}
                            <button
                                onClick={() => handleAction('api', importFromApi)}
                                disabled={!!isLoading}
                                className="w-full py-2.5 px-4 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading === 'api' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                )}
                                {isLoading === 'api' ? 'Importing...' : 'Start Import'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <h3 className="font-bold text-slate-900 mb-2">Import Logs</h3>
                        <div className="text-sm text-slate-500 italic">
                            No recent logs available.
                        </div>
                    </div>
                </>
            ) : (
                /* SETTINGS VIEW */
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900">Configuration Settings</h2>
                        <p className="text-slate-500 text-sm">Configure API connections and scraper behaviors.</p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Centralized API Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                <Database className="w-4 h-4" /> Centralized API
                            </h3>
                            <div className="grid gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint URL</label>
                                    <input
                                        type="text"
                                        value={settings.apiUrl}
                                        onChange={(e) => setSettings({ ...settings, apiUrl: e.target.value })}
                                        placeholder="https://api.example.com/v1/listings"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                    <input
                                        type="password"
                                        value={settings.apiKey}
                                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                        placeholder="••••••••••••••••"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Scraper Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                <Globe className="w-4 h-4" /> Scraper Settings
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.enableOlx}
                                        onChange={(e) => setSettings({ ...settings, enableOlx: e.target.checked })}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Enable OLX.ro Scraper</div>
                                        <div className="text-xs text-slate-500">Allow system to fetch listings from OLX.</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={settings.enablePubli24}
                                        onChange={(e) => setSettings({ ...settings, enablePubli24: e.target.checked })}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Enable Publi24.ro Scraper</div>
                                        <div className="text-xs text-slate-500">Allow system to fetch listings from Publi24.</div>
                                    </div>
                                </label>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Scrape Frequency</label>
                                    <select
                                        value={settings.scrapeFrequency}
                                        onChange={(e) => setSettings({ ...settings, scrapeFrequency: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="manual">Manual Only</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm">
                            {settingsStatus && (
                                <span className={settingsStatus.success ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                                    {settingsStatus.message}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            disabled={isLoading === 'save_settings'}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading === 'save_settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'partners' && (
                <PartnerManager />
            )}
        </div>
    );
}

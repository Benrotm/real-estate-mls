'use client';

import { useState, useEffect } from 'react';
import { ScraperConfig, getScraperConfigs, saveScraperConfig, deleteScraperConfig } from '@/app/lib/actions/scraper-config';
import { scrapeProperty } from '@/app/lib/actions/scrape';
import { Plus, Trash2, Save, Play, Globe, Code, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function PartnerManager() {
    const [configs, setConfigs] = useState<ScraperConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConfig, setSelectedConfig] = useState<ScraperConfig | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Test State
    const [testUrl, setTestUrl] = useState('');
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setIsLoading(true);
        const data = await getScraperConfigs();
        setConfigs(data);
        setIsLoading(false);
    };

    const handleAddNew = () => {
        const newConfig: ScraperConfig = {
            id: '',
            name: 'New Partner',
            domain: 'example.com',
            selectors: {
                title: '', price: '', currency: '', location: '', description: '', images: '',
                rooms: '', area: '', floor: ''
            },
            isActive: true
        };
        setSelectedConfig(newConfig);
        setIsEditing(true);
        setTestResult(null);
        setTestUrl('');
    };

    const handleEdit = (config: ScraperConfig) => {
        setSelectedConfig({ ...config });
        setIsEditing(true);
        setTestResult(null);
        setTestUrl('');
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

    const handleTestScrape = async () => {
        if (!testUrl || !selectedConfig) return;

        setIsTesting(true);
        setTestResult(null);

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
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="e.g. PropertyLab"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Domain</label>
                                    <input
                                        type="text"
                                        value={selectedConfig.domain}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, domain: e.target.value })}
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder="propertylab.ro"
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Selectors Grid */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Code className="w-4 h-4 text-purple-600" />
                                    <h4 className="font-bold text-slate-900">CSS Selectors Mapping</h4>
                                </div>
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
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                        placeholder={`Paste a URL from ${selectedConfig.domain || 'the target site'}...`}
                                    />
                                    <button
                                        onClick={handleTestScrape}
                                        disabled={isTesting || !testUrl}
                                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 disabled:opacity-50"
                                    >
                                        {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Test Scrape'}
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
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Scrape Successful
                                                </div>
                                                {Object.entries(testResult.data || {}).map(([k, v]) => (
                                                    <div key={k} className="grid grid-cols-3 gap-2 border-b border-slate-50 py-1">
                                                        <span className="font-bold text-slate-500">{k}</span>
                                                        <span className="col-span-2 font-mono text-slate-800 truncate" title={String(v)}>
                                                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                                        </span>
                                                    </div>
                                                ))}
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

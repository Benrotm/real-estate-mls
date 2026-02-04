'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Database, Rss, X, Loader2, AlertCircle, CheckCircle2, Link as LinkIcon, Globe } from 'lucide-react';
import { importPropertiesFromCSV } from '@/app/lib/actions/import';
import { scrapeProperty, ScrapedProperty } from '@/app/lib/actions/scrape';

interface ImportPropertiesModalProps {
    onScrapeSuccess?: (data: ScrapedProperty) => void;
    showDefaultButton?: boolean;
    forceOpen?: boolean;
    onClose?: () => void;
}

export default function ImportPropertiesModal({ onScrapeSuccess, showDefaultButton = true, forceOpen = false, onClose }: ImportPropertiesModalProps) {
    const [isOpen, setIsOpen] = useState(forceOpen);

    // Sync with forceOpen prop
    // Sync with forceOpen prop
    useEffect(() => {
        setIsOpen(forceOpen);
    }, [forceOpen]);

    const [activeTab, setActiveTab] = useState<'csv' | 'link' | 'xml' | 'crm'>('csv');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [linkUrl, setLinkUrl] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => {
        setIsOpen(false);
        setResult(null);
        setIsLoading(false);
        setLinkUrl('');
        if (onClose) onClose();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await importPropertiesFromCSV(formData);
            if (response.error) {
                setResult({ success: false, message: response.error });
            } else {
                setResult({ success: true, message: `Successfully imported propert${response.count === 1 ? 'y' : 'ies'}` });
                // Optional: Refresh page or redirect
                // window.location.reload(); 
            }
        } catch (error) {
            setResult({ success: false, message: 'Failed to upload file. Please try again.' });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLinkScrape = async () => {
        if (!linkUrl) return;

        setIsLoading(true);
        setResult(null);

        try {
            const { data, error } = await scrapeProperty(linkUrl);

            if (error) {
                setResult({ success: false, message: error });
            } else if (data) {
                setResult({ success: true, message: 'Property data scraped successfully! The form will be populated.' });
                // Pass data back to parent form
                if (onScrapeSuccess) {
                    onScrapeSuccess(data);
                }

                // Close modal after short delay to show success
                setTimeout(() => {
                    handleClose();
                }, 1500);
            }
        } catch (error) {
            setResult({ success: false, message: 'Failed to scrape URL. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        if (!showDefaultButton) return null;
        return (
            <button
                onClick={handleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium shadow-sm"
            >
                <Upload className="w-4 h-4" />
                Import Properties
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Import Properties</h2>
                        <p className="text-sm text-slate-500">Add multiple listings at once from external sources.</p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('csv')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 transition font-medium text-sm whitespace-nowrap ${activeTab === 'csv' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('link')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 transition font-medium text-sm whitespace-nowrap ${activeTab === 'link' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <LinkIcon className="w-4 h-4" />
                        From Link
                    </button>
                    <button
                        onClick={() => setActiveTab('xml')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 transition font-medium text-sm whitespace-nowrap ${activeTab === 'xml' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Rss className="w-4 h-4" />
                        XML Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('crm')}
                        className={`flex items-center gap-2 py-4 px-4 border-b-2 transition font-medium text-sm whitespace-nowrap ${activeTab === 'crm' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Database className="w-4 h-4" />
                        CRM Sync
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 min-h-[300px]">
                    {activeTab === 'csv' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-blue-900">CSV Import Guide</h4>
                                    <p className="text-sm text-blue-700">
                                        Upload a .csv file with columns: <code>title, price, currency, type, listing_type, address</code>.
                                        Additional columns will be mapped automatically if they match our schema.
                                    </p>
                                </div>
                            </div>

                            {!isLoading && !result && (
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer group relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="bg-slate-100 p-4 rounded-full mb-4 group-hover:scale-110 transition">
                                        <Upload className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">Click to upload CSV</h3>
                                    <p className="text-slate-500 text-sm">or drag and drop file here</p>
                                </div>
                            )}

                            {/* ... Loading and Result states are handled below ... */}
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="space-y-6">
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex gap-3 items-start">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Globe className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-purple-900">Import from Web Link</h4>
                                    <p className="text-sm text-purple-700">
                                        Paste a URL from a real estate portal. We'll attempt to extract the title, price, description, images, and other details automatically.
                                    </p>
                                </div>
                            </div>

                            {!isLoading && !result && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Property URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                placeholder="https://example.com/property/123"
                                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLinkScrape}
                                        disabled={!linkUrl}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Scrape & Import Data
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ... XML and CRM tabs ... */}
                    {activeTab === 'xml' && (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-4">
                            <div className="bg-slate-100 p-4 rounded-full">
                                <Rss className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">XML Feed Import</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Connect your XML feed from other portals (Imobiliare.ro, OLX, etc) to automatically sync listings.
                                </p>
                            </div>
                            <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                                COMING SOON
                            </div>
                        </div>
                    )}

                    {activeTab === 'crm' && (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-4">
                            <div className="bg-slate-100 p-4 rounded-full">
                                <Database className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">CRM Synchronization</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Sync directly with popular Real Estate CRMs (SoftImobiliar, FlexMLS, Salesforce).
                                </p>
                            </div>
                            <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                                COMING SOON
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="py-12 flex flex-col items-center justify-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">Processing...</p>
                        </div>
                    )}

                    {/* Result State */}
                    {result && (
                        <div className={`p-6 rounded-xl border flex flex-col items-center text-center ${result.success ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            {result.success ? (
                                <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
                            ) : (
                                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                            )}
                            <h3 className={`text-lg font-bold mb-1 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                {result.success ? 'Success' : 'Failed'}
                            </h3>
                            <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                {result.message}
                            </p>

                            {/* Actions for success/failure */}
                            {result.success && activeTab === 'csv' && (
                                <button onClick={() => window.location.href = '/dashboard/owner/properties'} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                                    View Properties
                                </button>
                            )}
                            {!result.success && (
                                <button onClick={() => setResult(null)} className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg font-medium hover:bg-red-50 transition">
                                    Try Again
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


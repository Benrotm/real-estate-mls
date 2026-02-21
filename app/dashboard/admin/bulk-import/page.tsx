'use client';

import { useState } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle2, Globe, FileDown } from 'lucide-react';
import Link from 'next/link';

export default function BulkImportPage() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleRunBulkScrape = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url || !url.includes('publi24.ro')) {
            setStatus('error');
            setMessage('Please enter a valid Publi24 category URL.');
            return;
        }

        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            // Get base Render URL dynamically from the existing env var
            const scraperApiBase = process.env.NEXT_PUBLIC_SCRAPER_API_URL || '';
            const runBulkEndpoint = scraperApiBase.replace('/scrape-advanced', '/run-bulk-scrape');

            // Build the absolute webhook URL that the Render Cron will send properties to limitlessly
            const webhookUrl = `${window.location.origin}/api/admin/bulk-scrape-item`;

            const res = await fetch(runBulkEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    categoryUrl: url,
                    webhookUrl: webhookUrl
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to start bulk scraper');
            }

            setStatus('success');
            setMessage(`Crawler started successfully for: ${data.categoryUrl}. The Render microservice is now crawling the pages in the background and will inject new unseen properties into the database every 10-15 seconds. Check the Properties list shortly.`);
            setUrl('');

        } catch (err: any) {
            console.error('Bulk Import Error:', err);
            setStatus('error');
            setMessage(err.message || 'An unexpected error occurred while starting the crawler.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileDown className="w-8 h-8 text-purple-600" />
                        Publi24 Bulk Importer (Safe Cron Engine)
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Start a background crawler on the Render Microservice to safely harvest a Publi24 Category Page. The system automatically skips duplicates by checking the `scraped_urls` database table before importing.
                    </p>
                </div>
                <Link
                    href="/dashboard/admin/properties"
                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                >
                    Back to All Properties
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-100 bg-slate-50 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500 rounded-full opacity-10 blur-3xl" />
                    <div className="absolute right-20 bottom-0 w-32 h-32 bg-blue-500 rounded-full opacity-10 blur-3xl" />

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-inner">
                            <Globe className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Start Category Crawler</h2>
                            <p className="text-sm text-slate-600 mt-1 max-w-xl">
                                Paste the URL of a Publi24 real estate category (e.g., <i>https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/timis/</i>). The microservice will find all properties on the first page, ignore ones we already have, and import the remaining ones silently over the next few minutes.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleRunBulkScrape} className="max-w-2xl">
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Category Page URL</label>
                            <input
                                type="url"
                                required
                                placeholder="https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/timis/"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all font-medium placeholder-slate-400 bg-slate-50 focus:bg-white"
                                disabled={isLoading}
                            />
                        </div>

                        {status === 'success' && (
                            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-emerald-800 font-medium">
                                    {message}
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800 font-medium">
                                    {message}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !url}
                            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting Dispatcher...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 text-purple-400" />
                                    Launch Automated Crawler
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="text-sm text-blue-900">
                    <strong className="block mb-1">Architecture Note</strong>
                    This bulk importer does not stay open on your computer. It triggers the Render microservice, which then loops endlessly in the cloud. You can close this page immediately after launching. The <code>scraped_urls</code> database table keeps a permanent record of all URLs touched to ensure 100% duplicate protection forever.
                </div>
            </div>
        </div>
    );
}

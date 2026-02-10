import { getSavedSearches, deleteSavedSearch } from '@/app/lib/actions/savedSearches';
import Link from 'next/link';
import { Search, Trash2, Calendar, Play } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SavedSearchesPage() {
    const { success, data: searches, error } = await getSavedSearches();

    if (!success) {
        // If not auth, usually middleware handles this, but safe fallback
        if (error === 'Not authenticated') redirect('/auth/login');
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Saved Searches</h1>
                <Link
                    href="/properties"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    New Search
                </Link>
            </div>

            {(!searches || searches.length === 0) ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No saved searches</h3>
                    <p className="text-slate-500 mb-6">Save your favorite search filters to quickly find properties later.</p>
                    <Link
                        href="/properties"
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors inline-flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        Start Searching
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searches.map((search) => {
                        // Construct the query string from saved params
                        const params = new URLSearchParams();
                        if (search.query_params) {
                            Object.entries(search.query_params).forEach(([key, value]) => {
                                if (Array.isArray(value)) {
                                    value.forEach(v => params.append(key, String(v)));
                                } else {
                                    params.set(key, String(value));
                                }
                            });
                        }
                        const searchUrl = `/properties?${params.toString()}`;

                        // Format Date
                        const date = new Date(search.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                        });

                        return (
                            <div key={search.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={search.name}>
                                        {search.name}
                                    </h3>
                                    <form action={async () => {
                                        'use server';
                                        await deleteSavedSearch(search.id);
                                    }}>
                                        <button
                                            type="submit"
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Delete Search"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>

                                <div className="flex-1 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {/* Display a few key filters as badges */}
                                        {Object.entries(search.query_params || {}).slice(0, 4).map(([key, value]) => {
                                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                                            // Format key for display (e.g. location_city -> City)
                                            const label = key.replace('location_', '').replace('_', ' ');
                                            const displayValue = Array.isArray(value) ? `${value.length} items` : String(value);

                                            return (
                                                <span key={key} className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md capitalize">
                                                    {label}: {displayValue}
                                                </span>
                                            );
                                        })}
                                        {(Object.keys(search.query_params || {}).length > 4) && (
                                            <span className="inline-block px-2 py-1 bg-slate-50 text-slate-400 text-xs rounded-md">
                                                +{Object.keys(search.query_params || {}).length - 4} more
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                    <div className="flex items-center text-xs text-slate-400 gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {date}
                                    </div>
                                    <Link
                                        href={searchUrl}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                                    >
                                        Run Search <Play className="w-3 h-3 ml-1 fill-current" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

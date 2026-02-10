import { getSavedSearches, deleteSavedSearch } from '@/app/lib/actions/savedSearches';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { redirect } from 'next/navigation';
import SavedSearchCard from '@/app/components/dashboard/SavedSearchCard';

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
                    {searches.map((search) => (
                        <SavedSearchCard
                            key={search.id}
                            search={search}
                            onDelete={async (id) => {
                                'use server';
                                await deleteSavedSearch(id);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

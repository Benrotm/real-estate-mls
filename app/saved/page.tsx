import { Search, Heart } from 'lucide-react';
import Link from 'next/link';

export default function SavedPage() {
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Saved Searches</h1>
                    <Link href="/properties" className="text-orange-600 font-bold hover:text-orange-700">
                        Find Properties &rarr;
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No saved searches yet</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Save your common searches to get notified when new properties match your criteria.
                    </p>
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors"
                    >
                        <Search className="w-4 h-4" /> Start Searching
                    </Link>
                </div>
            </div>
        </div>
    );
}

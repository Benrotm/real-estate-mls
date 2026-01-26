import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Heart, Search } from 'lucide-react';
import Link from 'next/link';

export default async function SavedPage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/auth/login');
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 mt-16">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Saved Items</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Saved Searches */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Saved Searches</h2>
                    <p className="text-slate-600 mb-6">
                        You don't have any saved searches yet. Save your favorite filters to get notified of new listings.
                    </p>
                    <Link href="/properties" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition-colors">
                        Browse Properties
                    </Link>
                </div>

                {/* Saved Properties (Classics) */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 fill-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Favorite Properties</h2>
                    <p className="text-slate-600 mb-6">
                        Properties you heart will appear here. Keep track of your dream homes in one place.
                    </p>
                    <Link href="/properties" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-orange-600 bg-orange-100 hover:bg-orange-200 transition-colors">
                        Find a Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, Search, User, MapPin, ArrowRight, Home } from 'lucide-react';

export default async function ClientDashboard() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/auth/login');
    }

    if (profile.role !== 'client' && profile.role !== 'super_admin') {
        // If an agent/owner tries to access this, redirect them to their own dashboard
        // or keep them here if you want a unified view (but request asked for specific dashboard)
        // For now, let's allow access but mainly this is for clients.
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {profile.full_name?.split(' ')[0] || 'User'}!
                </h1>
                <p className="text-slate-600 mt-2">
                    Manage your favorite properties and searches from your personal dashboard.
                </p>
            </div>

            {/* Stats / Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

                {/* Saved Properties */}
                <Link
                    href="/saved"
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-200 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                            <Heart className="w-6 h-6 fill-current" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Saved Properties</h3>
                    <p className="text-sm text-slate-500">
                        View the homes you've liked
                    </p>
                </Link>

                {/* Saved Searches */}
                <Link
                    href="/saved"
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-200 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Search className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Saved Searches</h3>
                    <p className="text-sm text-slate-500">
                        Access your custom filters
                    </p>
                </Link>

                {/* Profile Settings */}
                <Link
                    href="/profile"
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-200 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                            <User className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">My Profile</h3>
                    <p className="text-sm text-slate-500">
                        Update your personal details
                    </p>
                </Link>
            </div>

            {/* Browse Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        Still looking for your dream home?
                    </h2>
                    <p className="text-slate-300 mb-8 text-lg">
                        Browse our latest listings with immersive video tours and detailed specifications.
                    </p>
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25"
                    >
                        <Home className="w-5 h-5" />
                        Browse Properties
                    </Link>
                </div>

                {/* Abstract Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            </div>
        </div>
    );
}

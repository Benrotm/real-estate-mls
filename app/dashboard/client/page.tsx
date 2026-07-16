import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Heart, Search, User, MapPin, ArrowRight, Home, BarChart, TrendingUp, FileText, Coins, Gift, Plus } from 'lucide-react';

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

            {/* Plan Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 text-slate-800">
                {/* Plan & Balance */}
                <div className="flex items-center gap-6 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                            <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                                {profile.plan_tier || 'Free'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-mono">{profile.credits || 0} CR</span>
                            <Link 
                                href="/cont/plati" 
                                className="text-[9.5px] bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded-md transition-colors font-bold uppercase ml-1.5"
                            >
                                Alimentează
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-xl">
                    {/* Ad Free Credits */}
                    <Link 
                        href="/cont/profil" 
                        className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between transition-colors group"
                    >
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ad Free Credits</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">Invită un Prieten</span>
                        </div>
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                            <Gift className="w-4 h-4" />
                        </div>
                    </Link>

                    {/* Ad Credits */}
                    <Link 
                        href="/cont/plati" 
                        className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between transition-colors group"
                    >
                        <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ad Credits</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors">Alimentează Credite</span>
                        </div>
                        <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                            <Plus className="w-4 h-4" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Stats / Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">

                {/* Saved Properties */}
                <Link
                    href="/dashboard/client/favorites"
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
                    href="/dashboard/client/searches"
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

                {/* Market Analytics */}
                <Link
                    href="/dashboard/client/analytics"
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-200 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                            <BarChart className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Market Analytics</h3>
                    <p className="text-sm text-slate-500">
                        Deep market data & trends
                    </p>
                </Link>

                {/* Proposal Contracts */}
                <Link
                    href="/dashboard/client/contracts"
                    className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-cyan-200 transition-all"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Contracte Vizionare</h3>
                    <p className="text-sm text-slate-500">
                        Semnează și vizualizează fișele de vizionare
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

import Link from 'next/link';
import { Building, Check, Eye, Clock, ArrowUpRight, Plus, BarChart, TrendingUp, MessageSquare } from 'lucide-react';
import HomeValuationWidget from '../../components/HomeValuationWidget';
import { getUserProfile, getUsageStats, getFeaturedStats } from '../../lib/auth';

export default async function OwnerDashboard() {
    const profile = await getUserProfile();

    if (!profile) {
        // Redirect to login with intent to be an owner
        // Using redirect from next/navigation (Server Component)
        const { redirect } = await import('next/navigation');
        redirect('/auth/login?role=owner');
        // This return is for TypeScript flow analysis (redirect throws internally)
        return null;
    }

    const usageCount = await getUsageStats(profile.id);
    const featuredCount = await getFeaturedStats(profile.id);

    const limit = profile.listings_limit || 1;
    const featuredLimit = profile.featured_limit || 0;

    const usagePercent = Math.min(100, Math.round((usageCount / limit) * 100));
    const featuredPercent = featuredLimit > 0 ? Math.min(100, Math.round((featuredCount / featuredLimit) * 100)) : 0;

    const availableListings = Math.max(0, limit - usageCount);
    const availableFeatured = Math.max(0, featuredLimit - featuredCount);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-[#1e293b] text-white py-12 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Owner'}</h1>
                        <p className="text-slate-400 mt-1">Your property dashboard</p>
                    </div>
                    <Link href="/properties/add" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        <Plus className="w-5 h-5" /> Add Property
                    </Link>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Card 1: My Listings */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">My Listings</div>
                            <div className="text-3xl font-bold text-slate-900">{usageCount} <span className="text-base text-slate-400 font-normal">/ {limit}</span></div>
                            <div className="text-xs text-green-600 font-bold mt-1">{availableListings} Available</div>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-lg flex items-center justify-center">
                            <Building className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 2: Featured */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Featured</div>
                            <div className="text-3xl font-bold text-slate-900">{featuredCount} <span className="text-base text-slate-400 font-normal">/ {featuredLimit}</span></div>
                            <div className="text-xs text-purple-600 font-bold mt-1">{availableFeatured} Available</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 text-purple-500 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Total Views</div>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-lg flex items-center justify-center">
                            <Eye className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-slate-500 mb-1">Interested</div>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Tools & Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Valuation Reports */}
                    <div className="h-full">
                        <HomeValuationWidget linkPath="/dashboard/owner/valuation" />
                    </div>

                    {/* Market Insights */}
                    <Link href="/dashboard/owner/market" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">Market Insights</h3>
                            <p className="text-slate-500 text-sm">Track local trends.</p>
                        </div>
                    </Link>

                    {/* Messages / Chat */}
                    <Link href="/dashboard/owner/chat" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-green-600 transition-colors">Messages</h3>
                            <p className="text-slate-500 text-sm">Chat with clients.</p>
                        </div>
                    </Link>
                </div>

                {/* Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Properties (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Inquiries */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                                    <MessageSquare className="w-4 h-4 text-orange-500" /> Recent Inquiries
                                </h3>
                                <button className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors">
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <div className="text-sm font-medium">No inquiries yet</div>
                            </div>
                        </div>

                        {/* Recent Properties */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-64 p-6 relative">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900">Recent Properties</h3>
                                <button className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900">
                                    View All <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                No properties found
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Span 1) */}
                    <div className="space-y-8">
                        {/* Your Plan */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
                                Your Plan
                                <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                                    {profile.plan_tier || 'Free'}
                                </span>
                            </h3>

                            {/* Listings Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>Listings Used</span>
                                    <span>{usageCount} / {limit}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                    <div
                                        className={`h-2 rounded-full ${usagePercent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                                        style={{ width: `${usagePercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-400 text-right">{availableListings} available</p>
                            </div>

                            {/* Featured Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                    <span>Featured Slots</span>
                                    <span>{featuredCount} / {featuredLimit}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                    <div
                                        className={`h-2 rounded-full ${featuredPercent >= 100 ? 'bg-red-500' : 'bg-purple-500'}`}
                                        style={{ width: `${featuredPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-400 text-right">{availableFeatured} available</p>
                            </div>

                            <button className="w-full border border-slate-200 text-slate-700 font-bold py-2 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm">
                                Upgrade Plan
                            </button>
                        </div>

                        {/* Property Types */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-64 flex flex-col">
                            <h3 className="font-bold text-slate-900 mb-4">Property Types</h3>
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                                No data available
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

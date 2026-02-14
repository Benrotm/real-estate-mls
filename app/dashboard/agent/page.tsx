import Link from 'next/link';
import { Building, Users, Eye, Target, Search, Plus, MessageSquare, BarChart, Bookmark, ArrowUpRight, TrendingUp } from 'lucide-react';
import { getUserProfile, getUsageStats, getFeaturedStats } from '../../lib/auth';
import { getRecentInquiries, getTotalPropertyViews, getActivePortfolioValue } from '../../lib/actions/propertyAnalytics';
import { getLeadsCount } from '../../lib/actions/leads';
import { formatCompactCurrency } from '../../lib/format';
import RecentInquiriesWidget from '../../components/dashboard/RecentInquiriesWidget';

export default async function AgentDashboard() {
    const profile = await getUserProfile();
    const usageCount = profile ? await getUsageStats(profile.id) : 0;
    const featuredCount = profile ? await getFeaturedStats(profile.id) : 0;
    const recentInquiries = await getRecentInquiries(5);
    const totalViews = await getTotalPropertyViews();
    const totalLeads = await getLeadsCount();
    const portfolioValue = await getActivePortfolioValue();

    const limit = profile?.listings_limit || 5;
    const featuredLimit = profile?.featured_limit || 0;

    const usagePercent = Math.min(100, Math.round((usageCount / limit) * 100));
    const featuredPercent = featuredLimit > 0 ? Math.min(100, Math.round((featuredCount / featuredLimit) * 100)) : 0;

    const availableListings = Math.max(0, limit - usageCount);
    const availableFeatured = Math.max(0, featuredLimit - featuredCount);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-[#1e293b] text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <Building className="w-3 h-3" /> Agent Dashboard
                        </div>
                        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || 'Agent'}</h1>
                        <p className="text-slate-400 mt-1">Manage your listings and track your performance</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href="/properties/add" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap text-sm">
                            <Plus className="w-4 h-4" /> Add Property
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

                {/* 1. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Active Listings */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Active Listings</div>
                            <div className="text-3xl font-bold text-slate-900">{usageCount}</div>
                            <div className="text-xs text-green-600 font-bold mt-1">{availableListings} Available</div>
                        </div>
                        <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <Building className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Featured Listings */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Featured</div>
                            <div className="text-3xl font-bold text-slate-900">{featuredCount}</div>
                            <div className="text-xs text-purple-600 font-bold mt-1">{availableFeatured} Available</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Total Views */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Views</div>
                            <div className="text-3xl font-bold text-slate-900">{totalViews}</div>
                            <div className="text-xs text-slate-400 mt-1">All properties</div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Eye className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Total Leads */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Leads</div>
                            <div className="text-3xl font-bold text-slate-900">{totalLeads}</div>
                            <div className="text-xs text-slate-400 mt-1">Active leads</div>
                        </div>
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Portfolio Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-sm font-medium text-orange-100 mb-1">Active Portfolio Value</div>
                        <div className="text-4xl font-bold text-white">{formatCompactCurrency(portfolioValue)}</div>
                    </div>

                    <div className="flex gap-12 mt-4 md:mt-0 relative z-10 text-center">
                        <div>
                            <div className="text-3xl font-bold">{usageCount}</div>
                            <div className="text-xs text-orange-100">Total Listings</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">{availableListings}</div>
                            <div className="text-xs text-orange-100">Slots Available</div>
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 pointer-events-none"></div>
                </div>

                {/* 3. Tools & Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Valuation Reports */}
                    <Link href="/dashboard/agent/valuation" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <BarChart className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Valuation Reports</h3>
                            <p className="text-slate-500 text-sm">AI-powered estimates.</p>
                        </div>
                    </Link>

                    {/* Market Insights */}
                    <Link href="/dashboard/agent/market" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">Market Insights</h3>
                            <p className="text-slate-500 text-sm">Track local trends.</p>
                        </div>
                    </Link>

                    {/* Messages / Chat */}
                    <Link href="/dashboard/agent/chat" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-green-600 transition-colors">Messages</h3>
                            <p className="text-slate-500 text-sm">Chat with leads.</p>
                        </div>
                    </Link>
                </div>

                {/* 4. Main Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Recent Inquiries */}
                        <RecentInquiriesWidget inquiries={recentInquiries} viewAllLink="/dashboard/agent/leads" />

                        {/* My Listings */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                                    <Building className="w-4 h-4 text-orange-500" /> My Listings
                                </h3>
                                <button className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors">
                                    Manage All <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="h-64 flex flex-col items-center justify-center">
                                <Building className="w-12 h-12 mb-3 text-slate-300 opacity-50" />
                                <div className="text-sm font-medium text-slate-500 mb-6">No properties listed yet</div>
                                <Link href="/properties/add" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Your First Property
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="space-y-8">
                        {/* Your Plan */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
                                Your Plan
                                <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                                    {profile?.plan_tier || 'Free'}
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

                            <button className="w-full border border-slate-200 text-slate-700 font-bold py-2.5 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors text-sm">
                                Upgrade Plan
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}


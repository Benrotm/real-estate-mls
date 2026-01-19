import Link from 'next/link';
import { Building, Users, Eye, Target, Search, Plus, MessageSquare, BarChart, Bookmark, ArrowUpRight } from 'lucide-react';

export default function AgentDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-[#1e293b] text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <Building className="w-3 h-3" /> Agent Dashboard
                        </div>
                        <h1 className="text-3xl font-bold">Welcome back, ben.silion</h1>
                        <p className="text-slate-400 mt-1">Manage your listings and track your performance</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
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
                            <div className="text-3xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-400 mt-1">0 pending</div>
                        </div>
                        <div className="w-10 h-10 bg-orange-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <Building className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Total Leads */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Leads</div>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-400 mt-1">0 new</div>
                        </div>
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Total Views */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Views</div>
                            <div className="text-3xl font-bold text-slate-900">0</div>
                            <div className="text-xs text-slate-400 mt-1">All listings</div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Eye className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Conversion Rate */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Conversion Rate</div>
                            <div className="text-3xl font-bold text-slate-900">0%</div>
                            <div className="text-xs text-slate-400 mt-1">0 closed deals</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Portfolio Banner */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-sm font-medium text-orange-100 mb-1">Active Portfolio Value</div>
                        <div className="text-4xl font-bold text-white">$0</div>
                    </div>

                    <div className="flex gap-12 mt-4 md:mt-0 relative z-10 text-center">
                        <div>
                            <div className="text-3xl font-bold">0</div>
                            <div className="text-xs text-orange-100">Total Listings</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold">0</div>
                            <div className="text-xs text-orange-100">Leads This Week</div>
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-12 pointer-events-none"></div>
                </div>

                {/* 3. Main Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (2/3 width) */}
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
                        {/* Lead Pipeline */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[240px]">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-6">
                                <BarChart className="w-4 h-4 text-orange-500" /> Lead Pipeline
                            </h3>
                            <div className="h-40 flex items-center justify-center text-slate-400 text-sm font-medium">
                                No leads data yet
                            </div>
                        </div>

                        {/* Saved Searches */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[240px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                                    <Bookmark className="w-4 h-4 text-orange-500" /> Saved Searches
                                </h3>
                                <ArrowUpRight className="w-4 h-4 text-slate-400" />
                            </div>

                            <div className="h-40 flex flex-col items-center justify-center text-center">
                                <div className="text-sm font-medium text-slate-400 mb-2">No saved searches</div>
                                <Link href="/properties" className="text-xs font-bold text-orange-500 hover:text-orange-600">
                                    Browse Properties
                                </Link>
                            </div>
                        </div>

                        {/* Your Plan */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-6">Your Plan</h3>

                            <div className="flex flex-col items-center mb-6">
                                <div className="bg-orange-500 text-white font-bold px-4 py-1.5 rounded-md uppercase text-sm tracking-wide shadow-md mb-3">
                                    Free
                                </div>
                                <p className="text-xs text-slate-500 font-medium">0 / 1 listings used</p>
                            </div>

                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
                                <div className="bg-orange-500 h-1.5 rounded-full w-0"></div>
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

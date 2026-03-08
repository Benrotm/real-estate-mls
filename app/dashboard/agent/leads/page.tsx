import Link from 'next/link';
import {
    Search, Plus,
    Filter, MoreHorizontal,
    Phone, Mail, Calendar,
    ArrowUpRight, User,
    MessageSquare, CheckCircle, Clock, XCircle, Edit
} from 'lucide-react';
import { fetchLeads } from '@/app/lib/actions/leads';
import LeadList from '@/app/components/dashboard/LeadList';



// Ensure page is dynamic to fetch latest data
export const dynamic = 'force-dynamic';

import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { redirect } from 'next/navigation';

export default async function LeadsPage() {
    // Feature verification removed per user request to enable access

    const leads = await fetchLeads();

    // Stats Calculations
    const totalLeads = leads.length;

    // Existing stats
    const newLeads = leads.filter(l => l.status === 'new').length;
    const conversionCount = leads.filter(l => l.status === 'closed').length;
    const conversionRate = totalLeads > 0 ? Math.round((conversionCount / totalLeads) * 100) : 0;

    // New "Admin Purpose" Stats
    const avgScore = totalLeads > 0
        ? Math.round(leads.reduce((acc, l) => acc + (Number(l.score) || 0), 0) / totalLeads)
        : 0;

    const hotLeads = leads.filter(l => (Number(l.score) || 0) >= 80).length;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActive = leads.filter(l => new Date(l.updated_at || l.created_at) > twentyFourHoursAgo).length;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Leads & CRM</h1>
                            <p className="text-slate-500 text-sm">Manage your client relationships and pipeline.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                                <ArrowUpRight className="w-4 h-4" /> Export
                            </button>
                            <Link href="/dashboard/agent/leads/add" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-orange-600/20">
                                <Plus className="w-4 h-4" /> Add New Lead
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Main Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <User className="w-12 h-12 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Leads</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{totalLeads}</div>
                            <div className="mt-2 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-block">Database Size</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <Calendar className="w-12 h-12 text-green-600" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">New Leads</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{newLeads}</div>
                            <div className="mt-2 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">Incoming Flow</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-12 h-12 text-purple-600" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Conversion Rate</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{conversionRate}%</div>
                            <div className="mt-2 text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full inline-block">{conversionCount} Closed deals</div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="w-12 h-12 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg. Quality</div>
                            <div className="text-3xl font-black text-slate-900 leading-none">{avgScore}</div>
                            <div className="mt-2 text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full inline-block">Lead Score Avg</div>
                        </div>
                    </div>
                </div>

                {/* Admin Purpose Cards */}
                <div className="mb-8 p-6 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 border border-slate-800">
                    <div className="flex items-center gap-2 mb-6 text-white/90">
                        <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg">
                            <Filter className="w-4 h-4" />
                        </div>
                        <h2 className="font-bold tracking-tight">Lead Insights & Admin Overview</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
                                    <MessageSquare className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-white/70">Hot Prospecting</span>
                            </div>
                            <div className="text-2xl font-black text-white">{hotLeads} <span className="text-xs font-medium text-white/40">Highly Interested</span></div>
                            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest font-bold">Score 80-100 Range</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-white/70">Recently Active</span>
                            </div>
                            <div className="text-2xl font-black text-white">{recentActive} <span className="text-xs font-medium text-white/40">Last 24 Hours</span></div>
                            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest font-bold">Latest Interactions</p>
                        </div>

                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-white/70">Active Pipeline</span>
                            </div>
                            <div className="text-2xl font-black text-white">{totalLeads - conversionCount} <span className="text-xs font-medium text-white/40">Total Open</span></div>
                            <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest font-bold">Excluding Closed/Lost</p>
                        </div>
                    </div>
                </div>

                {/* Leads List */}
                <LeadList leads={leads} basePath="/dashboard/agent/leads" />
            </div>
        </div>
    );
}

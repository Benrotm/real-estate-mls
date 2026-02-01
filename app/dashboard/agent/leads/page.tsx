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
    const newLeads = leads.filter(l => l.status === 'new').length;
    const pendingLeads = leads.filter(l => ['contacted', 'viewing', 'negotiation'].includes(l.status)).length;
    const conversionCount = leads.filter(l => l.status === 'closed').length;
    const conversionRate = totalLeads > 0 ? Math.round((conversionCount / totalLeads) * 100) : 0;

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

                    {/* Simple Client-side Search/Filter placeholders for now */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex gap-2 touch-pan-x overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            <button className="px-4 py-2 rounded-lg text-sm font-medium border whitespace-nowrap bg-slate-900 text-white border-slate-900">All Leads</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Leads</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</div>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">New Lead</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{newLeads}</div>
                        </div>
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Action</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{pendingLeads}</div>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Conversion Rate</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">{conversionRate}%</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Leads List */}
                {/* Leads List */}
                <LeadList leads={leads} basePath="/dashboard/agent/leads" />
            </div>
        </div>
    );
}

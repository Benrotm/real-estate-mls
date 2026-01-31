import Link from 'next/link';
import {
    Search, Plus,
    Filter, MoreHorizontal,
    Phone, Mail, Calendar,
    ArrowUpRight, User,
    MessageSquare, CheckCircle, Clock, XCircle, Edit
} from 'lucide-react';
import { fetchLeads } from '@/app/lib/actions/leads';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    viewing: 'bg-purple-100 text-purple-700 border-purple-200',
    negotiation: 'bg-orange-100 text-orange-700 border-orange-200',
    closed: 'bg-green-100 text-green-700 border-green-200',
    lost: 'bg-slate-100 text-slate-500 border-slate-200',
} as const;

const STATUS_LABELS = {
    new: 'New Lead',
    contacted: 'Contacted',
    viewing: 'Viewing Scheduled',
    negotiation: 'Negotiation',
    closed: 'Closed / Won',
    lost: 'Lost',
};

// Ensure page is dynamic to fetch latest data
export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
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
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferences</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.length > 0 ? (
                                    leads.map((lead: any) => (
                                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <Link href={`/dashboard/agent/leads/${lead.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                                                            {lead.name}
                                                        </Link>
                                                        <div className="text-xs text-slate-500">{lead.source || 'Unknown Source'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100'}`}>
                                                    {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] || lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`
                                                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                        ${(lead.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                                                            (lead.score || 0) >= 50 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-slate-100 text-slate-500'}
                                                    `}>
                                                        {lead.score || 0}
                                                    </div>
                                                    {(lead.score || 0) >= 80 && <span className="text-xs text-green-600 font-medium">Hot</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{lead.preference_type || 'Any Property'}</div>
                                                <div className="text-sm text-slate-500">
                                                    {lead.budget_max ? `Budget: ${lead.budget_max} ${lead.currency || 'EUR'}` : 'No Budget Set'}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {lead.preference_location_city} {lead.preference_location_area && `(${lead.preference_location_area})`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {lead.email && (
                                                        <a href={`mailto:${lead.email}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                            <Mail className="w-3.5 h-3.5" /> {lead.email}
                                                        </a>
                                                    )}
                                                    {lead.phone && (
                                                        <a href={`tel:${lead.phone}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                            <Phone className="w-3.5 h-3.5" /> {lead.phone}
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/dashboard/agent/leads/${lead.id}`} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-300" title="Edit Lead">
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Call">
                                                        <Phone className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-8 h-8 opacity-20" />
                                                <span className="text-sm">No leads added yet.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination / Footer (Static for now) */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Showing all {leads.length} entries</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50" disabled>Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

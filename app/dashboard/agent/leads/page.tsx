"use client";

import React, { useState } from 'react';
import {
    Search, Plus,
    Filter, MoreHorizontal,
    Phone, Mail, Calendar,
    ArrowUpRight, User,
    MessageSquare, CheckCircle, Clock, XCircle
} from 'lucide-react';

// Mock Data for Leads
const MOCK_LEADS = [
    {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 123-4567',
        status: 'new', // new, contacted, viewing, negotiation, closed, lost
        source: 'Website Inquiry',
        interest: 'Modern Apartment in City Center',
        budget: '$450k - $500k',
        lastContact: '2 hours ago',
        avatar: '', // uses fallback
        notes: 'Looking for 2 bedrooms, pet friendly.'
    },
    {
        id: '2',
        name: 'Michael Chen',
        email: 'm.chen@tech.co',
        phone: '+1 (555) 987-6543',
        status: 'viewing',
        source: 'Zillow',
        interest: 'Luxury Villa with Pool',
        budget: '$1.2M - $1.5M',
        lastContact: '1 day ago',
        avatar: '',
        notes: 'Scheduled viewing for Saturday.'
    },
    {
        id: '3',
        name: 'Emma Wilson',
        email: 'emma.w@design.studio',
        phone: '+1 (555) 456-7890',
        status: 'negotiation',
        source: 'Referral',
        interest: 'Downtown Loft',
        budget: '$750k',
        lastContact: '3 days ago',
        avatar: '',
        notes: 'Sent counter-offer.'
    },
    {
        id: '4',
        name: 'James Rodriguez',
        email: 'j.rodriguez@mail.com',
        phone: '+1 (555) 222-3333',
        status: 'contacted',
        source: 'Walk-in',
        interest: 'Family Home in Suburbs',
        budget: '$600k',
        lastContact: '5 days ago',
        avatar: '',
        notes: 'Needs to sell current home first.'
    },
    {
        id: '5',
        name: 'Robert Taylor',
        email: 'bob.taylor@corp.net',
        phone: '+1 (555) 777-8888',
        status: 'closed',
        source: 'Website Inquiry',
        interest: 'Commercial Office Space',
        budget: '$2.5k / month',
        lastContact: '1 week ago',
        avatar: '',
        notes: 'Lease signed.'
    }
];

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

export default function LeadsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredLeads = MOCK_LEADS.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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
                            <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-orange-600/20">
                                <Plus className="w-4 h-4" /> Add New Lead
                            </button>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search leads by name, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex gap-2 touch-pan-x overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {['all', 'new', 'contacted', 'viewing', 'closed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border whitespace-nowrap transition-colors ${statusFilter === status
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                >
                                    {status === 'all' ? 'All Leads' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                                </button>
                            ))}
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
                            <div className="text-2xl font-bold text-slate-900 mt-1">{MOCK_LEADS.length}</div>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">New This Week</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">3</div>
                        </div>
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Action</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">2</div>
                        </div>
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Conversion Rate</div>
                            <div className="text-2xl font-bold text-slate-900 mt-1">15%</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Leads List */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest & Budget</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLeads.length > 0 ? (
                                    filteredLeads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{lead.name}</div>
                                                        <div className="text-xs text-slate-500">{lead.source}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status as keyof typeof STATUS_COLORS]}`}>
                                                    {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS]}
                                                </span>
                                                <div className="text-xs text-slate-400 mt-1">Last: {lead.lastContact}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{lead.interest}</div>
                                                <div className="text-sm text-slate-500">Budget: <span className="font-semibold text-green-600">{lead.budget}</span></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <a href={`mailto:${lead.email}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                        <Mail className="w-3.5 h-3.5" /> {lead.email}
                                                    </a>
                                                    <a href={`tel:${lead.phone}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                        <Phone className="w-3.5 h-3.5" /> {lead.phone}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Call">
                                                        <Phone className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Message">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="More">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="w-8 h-8 opacity-20" />
                                                <span className="text-sm">No leads found matching your filters.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination / Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm text-slate-500">Showing 1 to {filteredLeads.length} of {MOCK_LEADS.length} entries</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-700 hover:bg-slate-50">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

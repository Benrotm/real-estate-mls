'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Phone, Edit, Search, CheckCircle, Clock, Trash2, X, AlertCircle } from 'lucide-react';
import { LeadData } from '@/app/lib/types';
import { deleteLead } from '@/app/lib/actions/leads';
import { useRouter } from 'next/navigation';

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

interface LeadListProps {
    leads: LeadData[];
    basePath: string; // e.g. '/dashboard/agent/leads' or '/dashboard/owner/leads'
    allowEdit?: boolean;
}

export default function LeadList({ leads, basePath, allowEdit = true }: LeadListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<string>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesSearch =
                (lead.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (lead.phone?.includes(searchTerm)) ||
                (lead.preference_type?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = activeStatus === 'all' || lead.status === activeStatus;

            return matchesSearch && matchesStatus;
        });
    }, [leads, searchTerm, activeStatus]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;

        setIsDeleting(id);
        try {
            await deleteLead(id);
            router.refresh();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete lead. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const statuses = ['all', 'new', 'contacted', 'viewing', 'negotiation', 'closed', 'lost'];

    return (
        <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or preference..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
                                ${activeStatus === status
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            {status === 'all' ? 'All Leads' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                        </button>
                    ))}
                </div>
            </div>

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
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map((lead: any) => (
                                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                    {(lead.name || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link href={`${basePath}/${lead.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                                                        {lead.name || 'Unnamed Lead'}
                                                    </Link>
                                                    <div className="text-xs text-slate-500">{lead.source || 'Unknown Source'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[(lead.status || 'new') as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100'}`}>
                                                {STATUS_LABELS[(lead.status || 'new') as keyof typeof STATUS_LABELS] || lead.status}
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
                                                {(lead.score || 0) >= 80 && <span className="text-xs text-green-600 font-medium tracking-tight">Hot Lead</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 truncate max-w-[150px]">{lead.preference_type || 'Any Property'}</div>
                                            <div className="text-sm text-slate-500">
                                                {lead.budget_max ? `Budget: ${Number(lead.budget_max).toLocaleString()} ${lead.currency || 'EUR'}` : 'No Budget Set'}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate max-w-[150px]">
                                                {lead.preference_location_city || ''} {lead.preference_location_area && `(${lead.preference_location_area})`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {lead.email && (
                                                    <a href={`mailto:${lead.email}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                        <Mail className="w-3.5 h-3.5 opacity-60" /> {lead.email}
                                                    </a>
                                                )}
                                                {lead.phone && (
                                                    <a href={`tel:${lead.phone}`} className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 transition-colors">
                                                        <Phone className="w-3.5 h-3.5 opacity-60" /> {lead.phone}
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {allowEdit && (
                                                    <Link href={`${basePath}/${lead.id}`} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-300" title="Edit Lead">
                                                        <Edit className="w-4 h-4" />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    disabled={isDeleting === lead.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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
                                            <span className="text-sm">
                                                {searchTerm || activeStatus !== 'all'
                                                    ? 'No leads match your search criteria.'
                                                    : 'No leads added yet.'}
                                            </span>
                                            {(searchTerm || activeStatus !== 'all') && (
                                                <button
                                                    onClick={() => { setSearchTerm(''); setActiveStatus('all'); }}
                                                    className="text-xs text-orange-600 font-bold hover:underline mt-2"
                                                >
                                                    Clear all filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Showing {filteredLeads.length} of {leads.length} leads
                    </span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

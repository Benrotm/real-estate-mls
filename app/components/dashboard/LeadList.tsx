
import Link from 'next/link';
import { Mail, Phone, Edit, Search, CheckCircle, Clock } from 'lucide-react';
import { LeadData } from '@/app/lib/actions/leads'; // Ensure this type is exported

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
    return (
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
                                                <Link href={`${basePath}/${lead.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
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
                                            {allowEdit && (
                                                <Link href={`${basePath}/${lead.id}`} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-300" title="Edit Lead">
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                            )}
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
    );
}

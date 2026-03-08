import { fetchAllLeadsAdmin } from '@/app/lib/actions/admin';
import { User, Phone, Mail, Calendar, Edit, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import NotificationSync from '@/app/components/notifications/NotificationSync';
import DeleteLeadButton from './DeleteLeadButton';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
    const leads = await fetchAllLeadsAdmin();

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <NotificationSync types={['lead', 'inquiry', 'offer']} />
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">All Leads Management</h1>
                    <p className="text-slate-500">Super Admin view of all system leads.</p>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold">
                    Total: {leads.length}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Lead Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Agent</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Score</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right sticky right-0 bg-slate-50 border-l border-slate-200 z-10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.map((lead: any) => (
                            <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{lead.name}</div>
                                    <div className="text-xs text-slate-500">{lead.source}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                            {lead.agent?.full_name?.charAt(0) || 'A'}
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-slate-900">{lead.agent?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{lead.agent?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">
                                        {lead.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${(lead.score || 0) > 50 ? 'text-green-600' : 'text-slate-500'
                                        }`}>
                                        {lead.score || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</div>}
                                    {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email}</div>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white border-l border-slate-100 group-hover:bg-slate-50 z-10 shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)] transition-colors">
                                    <div className="flex items-center justify-end gap-3 min-w-max">
                                        <Link
                                            href={`/dashboard/agent/leads/${lead.id}`}
                                            className="bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5"
                                        >
                                            View Details
                                            <ExternalLink className="w-3 h-3" />
                                        </Link>
                                        <DeleteLeadButton leadId={lead.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {leads.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400">
                                    No leads found in the system.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

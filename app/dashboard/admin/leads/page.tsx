import { fetchAllLeadsAdmin, deleteLeadAdmin } from '@/app/lib/actions/admin';
import { User, Phone, Mail, Trash2, Calendar, Edit } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
    const leads = await fetchAllLeadsAdmin();

    async function deleteLead(formData: FormData) {
        'use server';
        const id = formData.get('id') as string;
        await deleteLeadAdmin(id);
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">All Leads Management</h1>
                    <p className="text-slate-500">Super Admin view of all system leads.</p>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold">
                    Total: {leads.length}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Lead Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Agent</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Score</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Contact</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
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
                                <td className="px-6 py-4 text-right">
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/agent/leads/${lead.id}`}
                                                className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Lead"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <form action={deleteLead}>
                                                <input type="hidden" name="id" value={lead.id} />
                                                <button
                                                    type="submit"
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                    title="Delete Lead"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
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

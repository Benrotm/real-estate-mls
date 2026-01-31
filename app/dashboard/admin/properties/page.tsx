import { fetchAllPropertiesAdmin, deletePropertyAdmin } from '@/app/lib/actions/admin';
import { Trash2, MapPin, ExternalLink, User, Edit } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
    let properties: any[] = [];
    let errorMsg = null;

    try {
        properties = await fetchAllPropertiesAdmin();
    } catch (err: any) {
        errorMsg = err.message || "Unknown Error";
    }

    async function deleteProperty(formData: FormData) {
        'use server';
        const id = formData.get('id') as string;
        await deletePropertyAdmin(id);
    }

    if (errorMsg) {
        return <div className="p-8 text-red-600">Error loading properties: {errorMsg}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">All Properties Management</h1>
                    <p className="text-slate-500">Super Admin view of all listings.</p>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-bold">
                    Total: {properties.length}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Property</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Owner</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Created</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {properties.map((property: any) => (
                            <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="font-bold text-slate-900 truncate max-w-xs" title={property.title}>
                                            {property.title}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" />
                                            {property.location_city || 'N/A'}, {property.location_county || 'N/A'}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-slate-900">
                                                {property.owner?.full_name || 'Unknown Owner'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${property.status === 'active' ? 'bg-green-100 text-green-700' :
                                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {property.status || 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                    {property.price?.toLocaleString()} {property.currency}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                    {new Date(property.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/dashboard/admin/properties/${property.id}/edit`}
                                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Property"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/properties/${property.id}`}
                                            target="_blank"
                                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="View Public Page"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        <form action={deleteProperty}>
                                            <input type="hidden" name="id" value={property.id} />
                                            <button
                                                type="submit"
                                                className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                title="Delete Property"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

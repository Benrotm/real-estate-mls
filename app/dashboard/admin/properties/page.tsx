import { fetchAllPropertiesAdmin, deletePropertyAdmin, updatePropertyStatusAdmin } from '@/app/lib/actions/admin';
import { Trash2, Building, MapPin, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
    let properties: any[] = [];
    let errorMsg = null;
    let debugUser = null;

    try {
        properties = await fetchAllPropertiesAdmin();
    } catch (err: any) {
        errorMsg = err.message;
        // Fetch debug info manually
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            debugUser = { id: user.id, email: user.email, profile };
        } else {
            debugUser = "No User Session";
        }
    }

    async function deleteProperty(formData: FormData) {
        'use server';
        const id = formData.get('id') as string;
        await deletePropertyAdmin(id);
    }

    if (errorMsg) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Debug: Fetch Failed
                    </h2>
                    <p className="text-red-700 font-mono mt-2">{errorMsg}</p>

                    <div className="mt-4 p-4 bg-white rounded border border-red-100 font-mono text-xs overflow-auto">
                        <strong>User Debug Info:</strong>
                        <pre>{JSON.stringify(debugUser, null, 2)}</pre>
                    </div>
                </div>
            </div>
        );
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
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Score</th>
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
                                            {property.location_city}, {property.location_county}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                            {property.owner?.full_name?.charAt(0) || 'O'}
                                        </div>
                                        <div className="text-sm">
                                            <div className="font-medium text-slate-900">{property.owner?.full_name || 'Unknown'}</div>
                                            {/* Role removed from query, so hiding it to prevent errors */}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${property.status === 'active' ? 'bg-green-100 text-green-700' :
                                        property.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {property.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`font-bold ${(property.score || 0) >= 50 ? 'text-orange-600' : 'text-slate-500'
                                        }`}>
                                        {property.score || 0}
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
                                                onClick={() => confirm('Are you sure? This cannot be undone.')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {properties.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-400">
                                    No properties found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

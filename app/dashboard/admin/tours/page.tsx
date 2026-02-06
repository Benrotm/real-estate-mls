import { getVirtualTours, deleteVirtualTour } from '@/app/lib/actions/tours';
import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Globe, Plus, Trash2, Eye, Edit, User } from 'lucide-react';

export default async function AdminToursPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Fetch ALL tours (no ownerId filter)
    const tours = await getVirtualTours();

    async function handleDelete(formData: FormData) {
        'use server';
        const id = formData.get('id') as string;
        await deleteVirtualTour(id);
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Globe className="w-8 h-8 text-fuchsia-600" />
                        All Virtual Tours
                    </h1>
                    <p className="text-slate-500 mt-1">Manage all virtual tours across the platform.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                            <th className="p-4">Tour</th>
                            <th className="p-4">Owner</th>
                            <th className="p-4">Property</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tours.map((tour) => (
                            <tr key={tour.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-8 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                            {tour.thumbnail_url || tour.tour_data?.scenes?.[0]?.image_url ? (
                                                <img
                                                    src={tour.thumbnail_url || tour.tour_data?.scenes?.[0]?.image_url}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{tour.title}</div>
                                            <div className="text-xs text-slate-500">{tour.tour_data?.scenes?.length || 0} scenes</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <User className="w-3 h-3 text-slate-400" />
                                        {tour.owner?.full_name || tour.owner?.email || 'Unknown'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {tour.property ? (
                                        <Link href={`/properties/${tour.property.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
                                            {tour.property.title}
                                        </Link>
                                    ) : (
                                        <span className="text-slate-400 text-sm italic">Unlinked</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tour.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {tour.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/tours/${tour.id}`}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="View Public Tour"
                                            target="_blank"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            href={`/dashboard/owner/tours/${tour.id}/edit`}
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="Edit Tour"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <form action={handleDelete}>
                                            <input type="hidden" name="id" value={tour.id} />
                                            <button
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Tour"
                                                onClick={(e) => {
                                                    if (!confirm('Are you sure you want to delete this tour? This cannot be undone.')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {tours.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No tours found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

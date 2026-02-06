import Link from 'next/link';
import { Plus, Eye, Edit, Trash2, Globe } from 'lucide-react';
import { getVirtualTours, deleteVirtualTour } from '@/app/lib/actions/tours';
import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ToursPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const tours = await getVirtualTours(user.id);

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
                        <Globe className="w-8 h-8 text-indigo-500" />
                        Virtual Tours
                    </h1>
                    <p className="text-slate-500 mt-1">Create and manage immersive 360° tours for your properties.</p>
                </div>
                <Link
                    href="/dashboard/owner/tours/create"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-5 h-5" />
                    Create New Tour
                </Link>
            </div>

            {tours.length === 0 ? (
                <div className="bg-white border text-center py-16 px-4 rounded-2xl border-slate-200 shadow-sm">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Globe className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Virtual Tours Yet</h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Start creating immersive experiences for your clients. Upload panoramic photos to build your first tour.
                    </p>
                    <Link
                        href="/dashboard/owner/tours/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Get Started
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tours.map((tour) => (
                        <div key={tour.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                {tour.thumbnail_url ? (
                                    <img
                                        src={tour.thumbnail_url}
                                        alt={tour.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                        <Globe className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Link
                                        href={`/tours/${tour.id}`}
                                        target="_blank"
                                        className="bg-white/90 text-slate-900 p-3 rounded-full hover:bg-white hover:scale-110 transition-all font-bold"
                                        title="View Live"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={`/dashboard/owner/tours/${tour.id}/edit`}
                                        className="bg-indigo-600/90 text-white p-3 rounded-full hover:bg-indigo-600 hover:scale-110 transition-all font-bold"
                                        title="Edit Tour"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{tour.title}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-1">
                                    {tour.property ? `Linked to: ${tour.property.title}` : 'Not linked to any property'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${tour.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {tour.status}
                                    </span>

                                    <form action={handleDelete}>
                                        <input type="hidden" name="id" value={tour.id} />
                                        <button
                                            type="submit"
                                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Tour"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

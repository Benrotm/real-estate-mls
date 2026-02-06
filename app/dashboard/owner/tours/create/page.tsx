'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVirtualTour } from '@/app/lib/actions/tours';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateTourPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;

        const result = await createVirtualTour({ title, description });

        if (result.success && result.data) {
            router.push(`/dashboard/owner/tours/${result.data.id}/edit`);
        } else {
            alert('Error creating tour');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8 text-indigo-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Tour</h1>
                <p className="text-slate-500 mb-8">Start by giving your tour a name. You can add scenes and hotspots in the next step.</p>

                <form action={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tour Title</label>
                        <input
                            name="title"
                            required
                            placeholder="e.g. Ocean View Penthouse"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Brief description of the tour..."
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Link
                            href="/dashboard/owner/tours"
                            className="flex-1 py-4 text-center font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next Step <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

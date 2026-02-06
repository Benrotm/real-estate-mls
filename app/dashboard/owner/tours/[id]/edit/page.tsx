import { getVirtualTourById } from '@/app/lib/actions/tours';
import { notFound, redirect } from 'next/navigation';
import TourEditor from '@/app/components/360/TourEditor';
import { createClient } from '@/app/lib/supabase/server';

export default async function TourEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const tour = await getVirtualTourById(id);

    if (!tour) {
        notFound();
    }

    // Authorization check
    // Admins can edit anything, Owners can only edit their own
    // Ideally we check role, but for now simple owner check + loose admin assumption (in real app check role)
    // Here we rely on the component/action RLS, but page should also protect.
    // Let's check strict ownership for "owner" route.
    if (tour.owner_id !== user.id) {
        // Check if admin
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            redirect('/dashboard/owner/tours');
        }
    }

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-white">
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    Editing: <span className="text-indigo-600">{tour.title}</span>
                </h1>
                <div className="text-sm text-slate-500">
                    {tour.status === 'draft' ? 'Draft Mode' : 'Live'}
                </div>
            </div>
            <TourEditor tour={tour} />
        </div>
    );
}

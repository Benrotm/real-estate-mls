import { getPropertyById } from '@/app/lib/actions/properties';
import AddPropertyForm from '@/app/dashboard/owner/add-property/AddPropertyForm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    const property = await getPropertyById(id);

    if (!property) {
        notFound();
    }

    // Ownership Check
    if (property.owner_id !== user.id) {
        // Redirect to dashboard if trying to edit someone else's property
        redirect('/dashboard/owner/properties');
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Property</h1>
            <AddPropertyForm initialData={property} />
        </div>
    );
}

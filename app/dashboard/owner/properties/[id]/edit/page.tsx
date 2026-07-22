import { getPropertyById } from '@/app/lib/actions/properties';
import AddPropertyForm from '@/app/properties/add/AddPropertyForm';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { hasFeature } from '@/app/lib/auth/features';
import { SYSTEM_FEATURES } from '@/app/lib/auth/feature-keys';

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

    // Fetch user profile to check can_edit_all_properties or admin roles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, can_edit_all_properties')
        .eq('id', user.id)
        .single();

    const isAdmin =
        profile?.role === 'admin' ||
        profile?.role === 'superadmin' ||
        profile?.role === 'super_admin' ||
        Boolean(profile?.can_edit_all_properties);

    // Ownership Check
    if (property.owner_id !== user.id && !isAdmin) {
        // Redirect to dashboard if trying to edit someone else's property
        redirect('/dashboard/owner/properties');
    }

    const canUseVirtualTours = await hasFeature(SYSTEM_FEATURES.VIRTUAL_TOUR);

    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Edit Property</h1>
            <AddPropertyForm initialData={property} canUseVirtualTours={canUseVirtualTours} />
        </div>
    );
}

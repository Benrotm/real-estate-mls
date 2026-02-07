import { getPropertyById } from '@/app/lib/actions/properties';
import AddPropertyForm from '@/app/properties/add/AddPropertyForm';
import PropertyValuationSection from '@/app/components/valuation/PropertyValuationSection';
import EventClient from '@/app/components/events/EventClient';
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

            {/* Event Management Section */}
            <div className="mt-12 pt-12 border-t border-slate-200">
                <EventClient propertyId={property.id} />
            </div>

            <div className="mt-12 pt-12 border-t border-slate-200">
                <PropertyValuationSection property={property} showMakeOffer={false} />
            </div>
        </div>
    );
}

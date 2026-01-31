import { getPropertyById } from '@/app/lib/actions/properties';
import { notFound } from 'next/navigation';
import PropertyAdminForm from '../../PropertyAdminForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminEditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const property = await getPropertyById(id);

    if (!property) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/dashboard/admin/properties" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to All Properties
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Edit Property</h1>
                <p className="text-slate-500 mt-1">Super Admin Mode: Editing {property.title}</p>
            </div>

            <PropertyAdminForm initialData={property} propertyId={property.id} />
        </div>
    );
}

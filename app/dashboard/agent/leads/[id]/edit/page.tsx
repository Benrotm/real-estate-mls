import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LeadForm from '../../LeadForm';
import { fetchLead } from '@/app/lib/actions/leads';
import { notFound } from 'next/navigation';

export default async function EditLeadPage({ params }: { params: { id: string } }) {
    const lead = await fetchLead(params.id);

    if (!lead) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/dashboard/agent/leads" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Leads
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Edit Lead: {lead.name}</h1>
                <p className="text-slate-500 mt-1">Update client information and preferences.</p>
            </div>

            <LeadForm initialData={lead} isEditing={true} />
        </div>
    );
}

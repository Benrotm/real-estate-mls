'use client';

import { useRouter } from 'next/navigation';
import LeadForm from '@/app/dashboard/agent/leads/LeadForm';
import { LeadData } from '@/app/lib/actions/leads';

export default function EditFormWrapper({ initialData }: { initialData: any }) {
    const router = useRouter();

    return (
        <LeadForm
            initialData={initialData}
            isEditing={true}
            onCancel={() => router.push('/dashboard/admin/leads')}
        />
    );
}

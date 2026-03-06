import { fetchAllLeadsAdmin } from '@/app/lib/actions/admin';
import PipelineBoard from '@/app/dashboard/agent/pipeline/PipelineBoard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPipelinePage() {
    const leads = await fetchAllLeadsAdmin();

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="mb-6 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Sales Pipeline (Admin)</h1>
                    <p className="text-slate-500 text-sm">System-wide overview of all relationships and deal flow.</p>
                </div>
                <Link href="/dashboard/agent/leads/add" className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 flex items-center gap-2 shadow-sm shadow-orange-600/20 transition-colors">
                    <Plus className="w-4 h-4" /> Add Lead
                </Link>
            </div>

            <PipelineBoard initialLeads={leads as any} />
        </div>
    );
}

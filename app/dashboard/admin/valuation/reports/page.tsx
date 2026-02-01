import ValuationClient from '@/app/dashboard/agent/valuation/ValuationClient';

export default async function AdminValuationReportsPage() {
    // Reusing the same client component as agents/clients
    // Admins can see the same view.
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Valuation Reports</h1>
                <p className="text-slate-500">Run smart valuations on any property.</p>
            </div>
            <ValuationClient />
        </div>
    );
}

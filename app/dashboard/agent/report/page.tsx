import { getUserTickets } from '@/app/lib/actions/tickets';
import UserTicketList from '@/app/components/dashboard/UserTicketList';
import { Flag } from 'lucide-react';

export default async function AgentReportPage() {
    const { tickets, error } = await getUserTickets();

    if (error) {
        return <div className="p-8 text-red-600">Error loading tickets: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Flag className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Report & Suggest</h1>
                </div>
                <p className="text-slate-500 max-w-2xl">
                    Track your property reports, claims, and feature suggestions here.
                    Our support team reviews these items daily.
                </p>
            </div>

            <UserTicketList tickets={tickets || []} />
        </div>
    );
}

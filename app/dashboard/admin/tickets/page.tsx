import { getTickets, updateTicketStatus } from '@/app/lib/actions/admin-tickets';
import TicketList from './TicketList'; // Client component

export default async function AdminTicketsPage() {
    const { tickets, error } = await getTickets();

    if (error) {
        return <div className="p-8 text-red-600">Error loading tickets: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Tickets & Reports</h1>
                <p className="text-slate-500">Manage user reports and feature requests.</p>
            </div>

            <TicketList tickets={tickets || []} />
        </div>
    );
}

'use client';

import { useState } from 'react';
import { updateTicketStatus } from '@/app/lib/actions/admin-tickets';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle, Clock, Search, Filter, X, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Ticket {
    id: string;
    type: string;
    subject: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    images?: string[];
    user_id?: string;
    profiles?: {
        email: string;
        full_name: string;
    };
    admin_notes?: string;
}

export default function TicketList({ tickets: initialTickets }: { tickets: Ticket[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.profiles?.email?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        setIsUpdating(true);
        const res = await updateTicketStatus(id, newStatus);
        if (res.success) {
            setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
            if (selectedTicket?.id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } else {
            alert('Failed to update status');
        }
        setIsUpdating(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-yellow-100 text-yellow-700';
            case 'resolved': return 'bg-green-100 text-green-700';
            case 'closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex gap-2">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${statusFilter === status
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 w-full md:w-64"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Subject</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No tickets found
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-medium">{ticket.subject}</td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{ticket.type.replace('_', ' ')}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900">{ticket.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-400">{ticket.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-violet-600 hover:text-violet-700 font-medium text-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className="capitalize">{selectedTicket.type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{format(new Date(selectedTicket.created_at), 'PPP p')}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-bold text-slate-900 mb-2">Description</h3>
                                <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    {selectedTicket.description}
                                </p>
                            </div>

                            {selectedTicket.images && selectedTicket.images.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2">Attachments</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {selectedTicket.images.map((url, idx) => (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative h-32 rounded-lg overflow-hidden border border-slate-200 group">
                                                <Image src={url} alt="Attachment" fill className="object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-4">Admin Actions</h3>
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'open')}
                                        disabled={isUpdating || selectedTicket.status === 'open'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${selectedTicket.status === 'open' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        Mark Open
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'in_progress')}
                                        disabled={isUpdating || selectedTicket.status === 'in_progress'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${selectedTicket.status === 'in_progress' ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        Mark In Progress
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'resolved')}
                                        disabled={isUpdating || selectedTicket.status === 'resolved'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${selectedTicket.status === 'resolved' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        Mark Resolved
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedTicket.id, 'closed')}
                                        disabled={isUpdating || selectedTicket.status === 'closed'}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${selectedTicket.status === 'closed' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        Mark Closed
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

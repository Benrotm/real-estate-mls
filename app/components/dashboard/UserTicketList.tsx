'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Search, X, ExternalLink, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
    property_id?: string;
    property?: {
        id: string;
        title: string;
        address: string;
    };
    admin_notes?: string;
}

export default function UserTicketList({ tickets: initialTickets }: { tickets: Ticket[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

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
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${statusFilter === status
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
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        No tickets found.
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
                                        <td className="px-6 py-4 text-slate-900 font-medium">
                                            {ticket.subject}
                                            {ticket.property && (
                                                <div className="text-xs text-violet-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Property Report
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 capitalize">{ticket.type.replace('_', ' ')}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedTicket(ticket)}
                                                className="text-slate-600 hover:text-slate-900 font-medium text-sm underline"
                                            >
                                                View
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(selectedTicket.status)}`}>
                                        {selectedTicket.status.replace('_', ' ')}
                                    </span>
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
                            {/* Admin Notes */}
                            {selectedTicket.admin_notes && (
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Response from Support
                                    </h3>
                                    <p className="text-blue-800 text-sm whitespace-pre-wrap">
                                        {selectedTicket.admin_notes}
                                    </p>
                                </div>
                            )}

                            {/* Property Info Context */}
                            {selectedTicket.property && (
                                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4">
                                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Related Property
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-slate-900">{selectedTicket.property.title}</div>
                                            <div className="text-xs text-slate-500">{selectedTicket.property.address}</div>
                                        </div>
                                        <Link
                                            href={`/properties/${selectedTicket.property.id}`}
                                            target="_blank"
                                            className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 flex items-center gap-1"
                                        >
                                            View Property <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            )}

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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

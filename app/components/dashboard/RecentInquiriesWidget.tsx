import Link from 'next/link';
import { MessageSquare, ArrowUpRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Inquiry {
    id: string;
    created_at: string;
    name: string;
    message: string | null;
    property?: {
        id: string;
        title: string;
    } | null;
}

export default function RecentInquiriesWidget({
    inquiries,
    viewAllLink = "/dashboard/agent/leads"
}: {
    inquiries: Inquiry[];
    viewAllLink?: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <MessageSquare className="w-4 h-4 text-orange-500" /> Recent Inquiries
                </h3>
                <Link href={viewAllLink} className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors">
                    View All <ArrowUpRight className="w-3 h-3" />
                </Link>
            </div>

            {inquiries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                    <div className="text-sm font-medium">No inquiries yet</div>
                </div>
            ) : (
                <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-sm">
                                {inquiry.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-bold text-slate-900 truncate pr-2">{inquiry.name}</h4>
                                    <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                {inquiry.property && (
                                    <div className="text-xs text-orange-600 font-medium mb-1 truncate">
                                        Re: {inquiry.property.title}
                                    </div>
                                )}
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {inquiry.message || 'No message provided'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

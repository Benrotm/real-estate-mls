import AdminChatClient from '@/app/components/chat/AdminChatClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Support Chat (Admin) | Real Estate MLS',
    description: 'Manage support conversations.',
};

export default function AdminSupportChatPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Support Conversations</h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                    Live Real-time
                </span>
            </div>
            <AdminChatClient />
        </div>
    );
}

import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/app/components/chat/ChatLayout';

export default async function OwnerChatPage({ searchParams }: { searchParams: { id?: string } }) {
    const user = await getUserProfile();
    const initialConversationId = searchParams.id;

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role !== 'owner' && user.role !== 'super_admin') {
        redirect('/dashboard');
    }

    return (
        <div className="h-[600px] flex flex-col">
            <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-500">Chat with interested tenants and buyers.</p>
            </div>
            <div className="flex-1 min-h-0">
                <ChatLayout user={user} initialConversationId={initialConversationId} />
            </div>
        </div>
    );
}

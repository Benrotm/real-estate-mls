import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/app/components/chat/ChatLayout';

export default async function AgentChatPage({ searchParams }: { searchParams: { id?: string } }) {
    const user = await getUserProfile();
    const initialConversationId = searchParams.id;

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role !== 'agent' && user.role !== 'super_admin') {
        redirect('/dashboard');
    }

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-slate-900">Agent Messages</h1>
                <p className="text-slate-500">Communicate with clients and leads.</p>
            </div>
            <div className="flex-1 min-h-0">
                <ChatLayout user={user} initialConversationId={initialConversationId} />
            </div>
        </div>
    );
}

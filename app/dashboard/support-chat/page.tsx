import { getUserProfile } from '@/app/lib/auth';
import { getOrCreateSupportConversation } from '@/app/lib/actions/chat';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { redirect } from 'next/navigation';

export default async function SupportChatPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect('/auth/login');
    }

    // specific action to get the support conversation ID
    // This creates one if it doesn't exist, assigning a Super Admin to it.
    const result = await getOrCreateSupportConversation();

    if (result.error) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Unavailable</h1>
                <p className="text-slate-600">{result.error}</p>
                <p className="text-sm text-slate-400 mt-4">Please try again later or contact support via email.</p>
            </div>
        );
    }

    const conversationId = result.conversationId!;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-slate-900">Support Chat</h1>
                <p className="text-slate-500">Chat directly with our support team.</p>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                <ChatWindow
                    conversationId={conversationId}
                    currentUser={user}
                />
            </div>
        </div>
    );
}

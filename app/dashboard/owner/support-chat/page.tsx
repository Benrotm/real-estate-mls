import { getOrCreateSupportConversation } from '@/app/lib/actions/chat';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export default async function SupportChatPage() {
    const profile = await getUserProfile();
    if (!profile) redirect('/auth/login');

    const result = await getOrCreateSupportConversation();

    if (result.error) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl">
                Error: {result.error}
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <ChatWindow
                conversationId={result.conversationId}
                currentUser={profile}
                onBack={() => { }} // No back button needed in full page view
            />
        </div>
    );
}

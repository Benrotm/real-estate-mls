import { getOrCreateSupportConversation } from '@/app/lib/actions/chat';
import ChatLayout from '@/app/components/chat/ChatLayout';
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
        <div className="h-[650px] max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden transform transition-all my-8">
            <ChatLayout user={profile} initialConversationId={result.conversationId} />
        </div>
    );
}

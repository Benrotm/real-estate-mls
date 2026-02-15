import SupportChatClient from '@/app/components/chat/SupportChatClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Support Chat | Developer Dashboard',
    description: 'Chat with our support team.',
};

export default function DeveloperSupportChatPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Support Chat</h1>
            <SupportChatClient />
        </div>
    );
}

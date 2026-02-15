import SupportChatClient from '@/app/components/chat/SupportChatClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Support Chat | Real Estate MLS',
    description: 'Chat with our support team.',
};

export default function SupportChatPage() {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Support Chat</h1>
            <SupportChatClient />
        </div>
    );
}

import ChatLayout from '@/app/components/chat/ChatLayout';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminChatPage() {
    const profile = await getUserProfile();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
        redirect('/dashboard');
    }

    return (
        <div className="p-4 md:p-8 h-screen">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Support Messages</h1>
            <ChatLayout user={profile} />
        </div>
    );
}

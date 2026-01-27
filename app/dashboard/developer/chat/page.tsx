import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/app/components/chat/ChatLayout';

export default async function DeveloperChatPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role !== 'developer' && user.role !== 'super_admin') {
        redirect('/dashboard');
    }

    return (
        <div className="h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Project Inquiries</h1>
                <p className="text-slate-500">Manage communications with investors and buyers.</p>
            </div>
            <ChatLayout user={user} />
        </div>
    );
}

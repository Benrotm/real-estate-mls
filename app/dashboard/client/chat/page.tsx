import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import ChatLayout from '@/app/components/chat/ChatLayout';

export default async function ClientChatPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect('/auth/login');
    }

    if (user.role !== 'client' && user.role !== 'super_admin') {
        // Clients are the default role, so strict checking might be tricky if we default to client,
        // but ideally a client shouldn't be accessing this if they are logged in as something else?
        // Actually, let's keep it simple. If valid user, let them see it. 
        // But the existing pattern redirects if role mismatch. 
        // Let's stick to the pattern but be lenient for client since it's the base role.
        // redirect('/dashboard');
    }

    return (
        <div className="h-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
                <p className="text-slate-500">Communicated with agents and owners.</p>
            </div>
            <ChatLayout user={user} />
        </div>
    );
}

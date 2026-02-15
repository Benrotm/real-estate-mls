import ChatLayout from '@/app/components/chat/ChatLayout';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminChatPage() {
    const profile = await getUserProfile();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        redirect('/dashboard');
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-bold text-slate-900">Support Messages</h1>
                <p className="text-slate-500">Communicate with users and resolve issues.</p>
            </div>

            <div className="relative group">
                <div className="resize-y overflow-hidden h-[600px] min-h-[400px] max-h-[85vh] rounded-2xl border border-slate-200 shadow-xl bg-white pb-3">
                    <div className="h-full w-full">
                        <ChatLayout user={profile} />
                    </div>
                </div>

                {/* Visual Resize Handle Hint */}
                <div className="absolute bottom-1 left-0 right-0 h-3 bg-transparent cursor-ns-resize flex justify-center items-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="w-12 h-1 bg-slate-300 rounded-full mb-0.5"></div>
                </div>
            </div>
        </div>
    );
}

import { MessageSquare } from 'lucide-react';

export default function ClientChatPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>

            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No messages yet</h3>
                    <p className="text-slate-500 max-w-sm mt-2">
                        Start a conversation with an agent or property owner from a property listing page.
                    </p>
                    <a href="/properties" className="inline-block mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">
                        Browse Properties
                    </a>
                </div>
            </div>
        </div>
    );
}

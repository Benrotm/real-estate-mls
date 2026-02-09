'use client';

import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { UserProfile } from '@/app/lib/auth';

interface ChatLayoutProps {
    user: UserProfile;
    initialConversationId?: string;
}

export default function ChatLayout({ user, initialConversationId }: ChatLayoutProps) {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId || null);

    return (
        <div className="flex h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Sidebar / Conversation List */}
            <div className={`${selectedConversationId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-100`}>

                <ConversationList
                    userId={user.id}
                    selectedId={selectedConversationId}
                    onSelect={setSelectedConversationId}
                />
            </div>

            {/* Main Chat Window */}
            <div className={`${!selectedConversationId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50 relative`}>
                {selectedConversationId ? (
                    <ChatWindow
                        conversationId={selectedConversationId}
                        currentUser={user}
                        onBack={() => setSelectedConversationId(null)}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600">Select a conversation</h3>
                        <p className="text-sm mt-1">Choose a thread from the left to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

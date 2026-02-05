'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
    userId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<any[]>([]);

    // New Chat State
    const [showNewChatInput, setShowNewChatInput] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [newChatError, setNewChatError] = useState<string | null>(null);

    const fetchConversations = async () => {
        setLoading(true);
        // 1. Get IDs of conversations this user is in
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (!myConvos || myConvos.length === 0) {
            setLoading(false);
            setConversations([]);
            return;
        }

        const ids = myConvos.map(c => c.conversation_id);

        // 2. Fetch conversation details + participants
        const { data } = await supabase
            .from('conversations')
            .select(`
                id, 
                created_at,
                updated_at,
                conversation_participants (
                    user_id,
                    user:user_id ( full_name, email, role )
                )
            `)
            .in('id', ids)
            // Order by updated_at so recent messages bubble up
            .order('updated_at', { ascending: false });

        if (data) {
            // Process conversations to find the "other" participant
            const processed = data.map(conv => {
                // Find someone who is NOT me
                const other = conv.conversation_participants.find((p: any) => p.user_id !== userId);
                // If I'm chatting with myself (testing) or alone, fallback
                const displayUser: any = other?.user || (Array.isArray(conv.conversation_participants) ? conv.conversation_participants[0]?.user : null);

                return {
                    ...conv,
                    otherUser: displayUser,
                    // If no other user, it's just "Conversation"
                    title: displayUser ? (displayUser.full_name || displayUser.email) : 'Support Chat'
                };
            });
            setConversations(processed);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();

        // Subscription for real-time updates could go here
    }, [userId]);

    const handleCreateSupportCheck = async () => {
        // If we are owner/agent, maybe we want 'Support' button separately?
        // User asked for "WhatsApp style" - select from contacts. 
        // For now, let's make the "+" button open the "New Chat" email input.
        setShowNewChatInput(true);
        setNewChatError(null);
    };

    const startChatByEmail = async () => {
        if (!newChatEmail.trim()) return;
        setCreating(true);
        setNewChatError(null);

        try {
            const { startConversationByEmail } = await import('@/app/lib/actions/chat');
            const result = await startConversationByEmail(newChatEmail.trim());

            if (result.error) {
                setNewChatError(result.error);
            } else if (result.conversationId) {
                await fetchConversations();
                onSelect(result.conversationId);
                setShowNewChatInput(false);
                setNewChatEmail('');
            }
        } catch (e) {
            setNewChatError('Failed to start chat.');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10">
                <h2 className="font-bold text-slate-800 text-lg">Chats</h2>
                <button
                    onClick={() => setShowNewChatInput(!showNewChatInput)}
                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    title="New Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0 1 1 0 002 0z" /></svg>
                </button>
            </div>

            {/* New Chat Input Area */}
            {showNewChatInput && (
                <div className="p-3 bg-slate-100 border-b border-slate-200 animate-in slide-in-from-top-2">
                    <div className="text-xs font-semibold text-slate-500 mb-2">START A NEW CHAT</div>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Enter user email..."
                            className="flex-1 text-sm p-2 rounded-md border border-slate-300 focus:outline-none focus:border-violet-500"
                            value={newChatEmail}
                            onChange={(e) => setNewChatEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && startChatByEmail()}
                        />
                        <button
                            onClick={startChatByEmail}
                            disabled={creating}
                            className="bg-violet-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                        </button>
                    </div>
                    {newChatError && <p className="text-xs text-red-500 mt-1">{newChatError}</p>}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <p>No conversations.</p>
                        <button onClick={() => setShowNewChatInput(true)} className="text-violet-600 font-medium text-sm mt-2 hover:underline">Start one</button>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedId === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            {/* Avatar / Initials */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold text-lg ${selectedId === conv.id ? 'bg-orange-200 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                                {conv.otherUser?.full_name ? conv.otherUser.full_name[0].toUpperCase() : <User className="w-6 h-6" />}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`font-semibold truncate ${selectedId === conv.id ? 'text-slate-900' : 'text-slate-700'}`}>
                                        {conv.title}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-slate-500 truncate pr-2">
                                        {conv.otherUser?.email || conv.otherUser?.role || 'User'}
                                    </p>
                                    {/* Unread badge placeholder */}
                                    {/* <span className="w-2 h-2 bg-red-500 rounded-full"></span> */}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
    const [rawConversations, setRawConversations] = useState<any[]>([]);

    // Expert State: Use timestamps to track when a conversation was last "seen" locally.
    // This is more robust than a simple ID set because it survives race conditions with new messages.
    const [lastReadAt, setLastReadAt] = useState<Record<string, string>>({});

    // New Chat State
    const [showNewChatInput, setShowNewChatInput] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [newChatError, setNewChatError] = useState<string | null>(null);

    const fetchConversations = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Join conversations with participants and messages in one go for efficiency
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    conversation_participants!inner(
                        user_id,
                        user:user_id ( id, full_name, email, role, avatar_url )
                    ),
                    messages(
                        content,
                        created_at,
                        sender_id,
                        is_read
                    )
                `)
                .eq('conversation_participants.user_id', userId);

            if (error) throw error;

            if (data) {
                const processed = data.map(conv => {
                    const otherParticipant = conv.conversation_participants.find((p: any) => p.user_id !== userId);
                    const displayUser: any = otherParticipant?.user || (Array.isArray(conv.conversation_participants) ? conv.conversation_participants[0]?.user : null);

                    const sortedMessages = (conv.messages || []).sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    );
                    const lastMsg = sortedMessages[0];

                    return {
                        ...conv,
                        otherUser: displayUser,
                        lastMessage: lastMsg,
                        title: displayUser ? (displayUser.full_name || displayUser.email) : 'Support Chat'
                    };
                });
                setRawConversations(processed);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Derive display conversations
    const displayConversations = useMemo(() => {
        const processed = rawConversations.map(conv => {
            const localReadTime = lastReadAt[conv.id] ? new Date(lastReadAt[conv.id]).getTime() : 0;

            // A conversation is unread if:
            // 1. It is not currently selected
            // 2. The DB has messages from others that are !is_read
            // 3. AND the last message is newer than our local "last seen" timestamp
            const hasDbUnread = (conv.messages || []).some((m: any) => m.sender_id !== userId && !m.is_read);
            const lastMsgTime = conv.lastMessage ? new Date(conv.lastMessage.created_at).getTime() : 0;

            const isReadLocally = conv.id === selectedId || (localReadTime > 0 && lastMsgTime <= localReadTime);
            const unreadCount = isReadLocally ? 0 : (conv.messages || []).filter((m: any) =>
                m.sender_id !== userId && !m.is_read
            ).length;

            return {
                ...conv,
                displayUnreadCount: unreadCount
            };
        });

        // Priority Sorting: Unread first, then by updated_at
        processed.sort((a, b) => {
            if (a.displayUnreadCount > 0 && b.displayUnreadCount === 0) return -1;
            if (a.displayUnreadCount === 0 && b.displayUnreadCount > 0) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        return processed;
    }, [rawConversations, selectedId, lastReadAt, userId]);

    // Update lastReadAt when selecting or when new data arrives for the selected chat
    useEffect(() => {
        if (selectedId) {
            setLastReadAt(prev => ({
                ...prev,
                [selectedId]: new Date().toISOString()
            }));
        }
    }, [selectedId]);

    useEffect(() => {
        fetchConversations(rawConversations.length > 0);

        // Explicit, robust subscriptions
        const channel = supabase
            .channel(`chat-list-expert-${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => fetchConversations(true)
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => fetchConversations(true)
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => fetchConversations(true)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchConversations]);

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

    if (loading && rawConversations.length === 0) {
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
                            className="bg-violet-600 text-white px-3 py-2 rounded-md text-sm font-normal hover:bg-violet-700 disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                        </button>
                    </div>
                    {newChatError && <p className="text-xs text-red-500 mt-1">{newChatError}</p>}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {displayConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <p>No conversations.</p>
                        <button onClick={() => setShowNewChatInput(true)} className="text-violet-600 text-sm mt-2 hover:underline">Start one</button>
                    </div>
                ) : (
                    displayConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedId === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg relative ${selectedId === conv.id ? 'bg-orange-200 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                                {conv.otherUser?.full_name ? conv.otherUser.full_name[0].toUpperCase() : <User className="w-6 h-6" />}
                                {conv.displayUnreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                        {conv.displayUnreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-baseline mb-1">
                                    <span className={`truncate font-normal ${conv.displayUnreadCount > 0 ? 'text-green-600' : 'text-slate-700'} ${selectedId === conv.id ? 'text-slate-900 !font-semibold' : ''}`}>
                                        {conv.title}
                                    </span>
                                    <span className={`text-[10px] shrink-0 font-normal ${conv.displayUnreadCount > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate pr-2 font-normal ${conv.displayUnreadCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                        {conv.lastMessage ? (
                                            <>
                                                {conv.lastMessage.sender_id === userId ? 'You: ' : ''}
                                                {conv.lastMessage.content}
                                            </>
                                        ) : (
                                            conv.otherUser?.email || conv.otherUser?.role || 'No messages yet'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

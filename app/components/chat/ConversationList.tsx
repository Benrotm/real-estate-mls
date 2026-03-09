'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
    userId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
    const [loading, setLoading] = useState(true);
    const [rawConversations, setRawConversations] = useState<any[]>([]);
    const loadingRef = useRef(false);

    // sessionClearedIds: Temporarily hide unread status for chats opened in this session
    // to provide "instant" feedback before the DB update propagates.
    const [sessionClearedIds, setSessionClearedIds] = useState<Set<string>>(new Set());

    // New Chat State
    const [showNewChatInput, setShowNewChatInput] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [newChatError, setNewChatError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const fetchConversations = useCallback(async (silent = false) => {
        if (loadingRef.current && silent) return;
        loadingRef.current = true;
        if (!silent) setLoading(true);

        try {
            // 1. Get Conversation IDs
            const { data: myConvos } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (!myConvos || myConvos.length === 0) {
                setRawConversations([]);
                setLoading(false);
                loadingRef.current = false;
                return;
            }

            const convoIds = myConvos.map(c => c.conversation_id);

            // 2. Fetch full details
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id, updated_at, created_at,
                    conversation_participants (
                        user_id,
                        user:user_id ( id, full_name, email, role, avatar_url )
                    ),
                    messages (
                        id, content, created_at, sender_id, is_read
                    )
                `)
                .in('id', convoIds);

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
            console.error('Fetch failed:', err);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [userId]);

    // Derived Display Logic
    const displayConversations = useMemo(() => {
        const processed = rawConversations.map(conv => {
            // Count unread messages from OTHERS in the DB
            const dbUnreadMessages = (conv.messages || []).filter((m: any) =>
                m.sender_id !== userId && !m.is_read
            );

            let unreadCount = dbUnreadMessages.length;

            // If it's currently selected OR was cleared in this session, override to 0
            if (conv.id === selectedId || sessionClearedIds.has(conv.id)) {
                unreadCount = 0;
            }

            return {
                ...conv,
                displayUnreadCount: unreadCount
            };
        });

        // Sort: Unread first, then by time
        processed.sort((a, b) => {
            if (a.displayUnreadCount > 0 && b.displayUnreadCount === 0) return -1;
            if (a.displayUnreadCount === 0 && b.displayUnreadCount > 0) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        return processed;
    }, [rawConversations, selectedId, sessionClearedIds, userId]);

    // Handle session clearing and real-time reset
    useEffect(() => {
        if (selectedId) {
            setSessionClearedIds(prev => {
                if (prev.has(selectedId)) return prev;
                const next = new Set(prev);
                next.add(selectedId);
                return next;
            });
        }
    }, [selectedId]);

    useEffect(() => {
        fetchConversations(rawConversations.length > 0);

        const channel = supabase
            .channel(`chat-sync-final-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                (payload: any) => {
                    // CRITICAL: If a new message arrived from someone else for a "cleared" chat,
                    // we MUST remove it from sessionClearedIds so it can show as unread again.
                    if (payload.eventType === 'INSERT' && payload.new?.sender_id !== userId) {
                        const cid = payload.new.conversation_id;
                        if (cid !== selectedId) {
                            setSessionClearedIds(prev => {
                                if (!prev.has(cid)) return prev;
                                const next = new Set(prev);
                                next.delete(cid);
                                return next;
                            });
                        }
                    }
                    // Refresh data for everyone
                    setTimeout(() => fetchConversations(true), 150);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => setTimeout(() => fetchConversations(true), 150)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchConversations, selectedId]);

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
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0 1 1 0 002 0z" /></svg>
                </button>
            </div>

            {showNewChatInput && (
                <div className="p-3 bg-slate-100 border-b border-slate-200 animate-in slide-in-from-top-1">
                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">New message</div>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="Recipient email..."
                            className="flex-1 text-sm p-2 rounded-md border border-slate-300 focus:outline-none focus:border-violet-500"
                            value={newChatEmail}
                            onChange={(e) => setNewChatEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && startChatByEmail()}
                        />
                        <button
                            onClick={startChatByEmail}
                            disabled={creating}
                            className="bg-violet-600 text-white px-3 py-2 rounded-md text-sm hover:bg-violet-700 disabled:opacity-50"
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
                        <p className="text-sm">No conversations yet.</p>
                        <button onClick={() => setShowNewChatInput(true)} className="text-violet-600 text-xs mt-2 hover:underline">Start a conversation</button>
                    </div>
                ) : (
                    displayConversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-all flex items-center gap-3 ${selectedId === conv.id ? 'bg-white shadow-[inset_4px_0_0_0_#8b5cf6]' : 'bg-transparent'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-lg relative ${selectedId === conv.id ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-500'}`}>
                                {conv.otherUser?.full_name ? conv.otherUser.full_name[0].toUpperCase() : <User className="w-6 h-6" />}
                                {conv.displayUnreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] flex items-center justify-center rounded-full border-[2.5px] border-slate-50">
                                        {conv.displayUnreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <span className={`truncate text-sm font-normal ${conv.displayUnreadCount > 0 ? 'text-green-600' : 'text-slate-700'} ${selectedId === conv.id ? 'text-slate-900 !font-semibold' : ''}`}>
                                        {conv.title}
                                    </span>
                                    <span className={`text-[10px] shrink-0 font-normal ${conv.displayUnreadCount > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className={`text-xs truncate pr-4 font-normal ${conv.displayUnreadCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                    {conv.lastMessage ? (
                                        <>
                                            {conv.lastMessage.sender_id === userId ? 'You: ' : ''}
                                            {conv.lastMessage.content}
                                        </>
                                    ) : (
                                        conv.otherUser?.email || 'No messages'
                                    )}
                                </p>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

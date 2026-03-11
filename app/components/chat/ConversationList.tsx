'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { markMessagesAsRead } from '@/app/lib/actions/chat';

interface ConversationListProps {
    userId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
    const [loading, setLoading] = useState(true);
    const [rawConversations, setRawConversations] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const loadingRef = useRef(false);
    const selectedIdRef = useRef<string | null>(selectedId);

    // sessionClearedIds: Temporarily suppress unread flag for chats just opened
    const [sessionClearedIds, setSessionClearedIds] = useState<Set<string>>(new Set());

    // New Chat State
    const [showNewChatInput, setShowNewChatInput] = useState(false);
    const [newChatEmail, setNewChatEmail] = useState('');
    const [newChatError, setNewChatError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    const fetchAllData = useCallback(async (silent = false) => {
        if (loadingRef.current && silent) return;
        loadingRef.current = true;
        if (!silent) setLoading(true);

        try {
            // 1. Get Conversation IDs
            const { data: participation } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);

            if (!participation || participation.length === 0) {
                setRawConversations([]);
                setUnreadCounts({});
                setLoading(false);
                loadingRef.current = false;
                return;
            }

            const convoIds = participation.map(p => p.conversation_id);

            // 2. Fetch Unread Counts from DB (Extremely high speed)
            const { data: unreadData } = await supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', convoIds)
                .eq('is_read', false)
                .neq('sender_id', userId);

            const dbCounts: Record<string, number> = {};
            unreadData?.forEach(m => {
                dbCounts[m.conversation_id] = (dbCounts[m.conversation_id] || 0) + 1;
            });
            setUnreadCounts(dbCounts);

            // 3. Fetch Full Conversation Details (Participants Only)
            const { data: convDetails, error } = await supabase
                .from('conversations')
                .select(`
                    id, updated_at, created_at,
                    conversation_participants (
                        user_id,
                        user:user_id ( id, full_name, email, role, avatar_url )
                    )
                `)
                .in('id', convoIds);

            if (error) throw error;

            if (convDetails) {
                // 4. Fetch the absolute latest message for EACH conversation (Optimized)
                // We use a limited fetch to get the top 100 messages across all relevant threads
                // This is much lighter than fetching entire histories
                const { data: latestMessages } = await supabase
                    .from('messages')
                    .select('id, content, created_at, sender_id, conversation_id')
                    .in('conversation_id', convoIds)
                    .order('created_at', { ascending: false })
                    .limit(100);

                const latestMap: Record<string, any> = {};
                latestMessages?.forEach(m => {
                    if (!latestMap[m.conversation_id]) {
                        latestMap[m.conversation_id] = m;
                    }
                });

                const processed = convDetails.map(conv => {
                    const otherParticipant = conv.conversation_participants.find((p: any) => p.user_id !== userId);
                    const displayUser: any = otherParticipant?.user || conv.conversation_participants[0]?.user;

                    return {
                        ...conv,
                        otherUser: displayUser,
                        lastMessage: latestMap[conv.id],
                        title: displayUser ? (displayUser.full_name || displayUser.email) : 'Support Chat'
                    };
                });
                setRawConversations(processed);
            }
        } catch (err) {
            console.error('[Chat] Fetch failed:', err);
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [userId]);

    // Derived Display Logic
    const displayConversations = useMemo(() => {
        const processed = rawConversations.map(conv => {
            let count = unreadCounts[conv.id] || 0;

            // UI Suppression Logic
            if (conv.id === selectedId || sessionClearedIds.has(conv.id)) {
                count = 0;
            }

            return {
                ...conv,
                displayUnreadCount: count
            };
        });

        // Sort: Unread first, then by time
        processed.sort((a, b) => {
            if (a.displayUnreadCount > 0 && b.displayUnreadCount === 0) return -1;
            if (a.displayUnreadCount === 0 && b.displayUnreadCount > 0) return 1;
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });

        return processed;
    }, [rawConversations, unreadCounts, selectedId, sessionClearedIds]);

    // Handle Selection
    useEffect(() => {
        if (selectedId) {
            setSessionClearedIds(prev => {
                if (prev.has(selectedId)) return prev;
                const next = new Set(prev);
                next.add(selectedId);
                return next;
            });
            markMessagesAsRead(selectedId, userId);
        }
    }, [selectedId, userId]);

    // Real-time Engine
    useEffect(() => {
        fetchAllData();

        const channel = supabase
            .channel(`all-messages-v4-${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload: any) => {
                    const { conversation_id: cid, sender_id: senderId } = payload.new;

                    if (senderId !== userId && cid !== selectedIdRef.current) {
                        setUnreadCounts(prev => ({
                            ...prev,
                            [cid]: (prev[cid] || 0) + 1
                        }));

                        setSessionClearedIds(prev => {
                            if (!prev.has(cid)) return prev;
                            const next = new Set(prev);
                            next.delete(cid);
                            return next;
                        });
                    }

                    // Background sync after a delay
                    setTimeout(() => fetchAllData(true), 150);
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages' },
                () => setTimeout(() => fetchAllData(true), 150)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchAllData]);

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
                await fetchAllData();
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
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <h2 className="font-bold text-slate-800 text-lg">Messages</h2>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/30"></div>
                    <button
                        onClick={() => setShowNewChatInput(!showNewChatInput)}
                        className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <User className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {showNewChatInput && (
                <div className="p-3 bg-slate-100 border-b border-slate-200 animate-in slide-in-from-top-1">
                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest leading-none">New conversation</div>
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
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {displayConversations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <p className="text-sm font-normal">No messages found.</p>
                        <button onClick={() => setShowNewChatInput(true)} className="text-violet-600 text-xs mt-2 hover:underline font-normal">Start new chat</button>
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
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] flex items-center justify-center rounded-full border-[2.5px] border-slate-50 shadow-md">
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
                                        {conv.updated_at ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true }) : ''}
                                    </span>
                                </div>
                                <p className={`text-xs truncate pr-4 font-normal ${conv.displayUnreadCount > 0 ? 'text-green-700' : 'text-slate-500'}`}>
                                    {conv.lastMessage ? (
                                        <>
                                            {conv.lastMessage.sender_id === userId ? 'You: ' : ''}
                                            {conv.lastMessage.content}
                                        </>
                                    ) : (
                                        conv.otherUser?.email || 'Start chatting...'
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

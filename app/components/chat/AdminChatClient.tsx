'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { getAdminConversations, sendMessage } from '@/app/lib/actions/chat';
import { Send, Loader2, Search, MoreVertical, CheckCheck } from 'lucide-react';
import Image from 'next/image';

type Participant = {
    user_id: string;
    profile: {
        full_name: string | null;
        avatar_url: string | null;
        email: string;
    };
};

type Message = {
    id: string;
    conversation_id: string;
    sender_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
};

type Conversation = {
    id: string;
    updated_at: string;
    participants: Participant[];
    messages: Message[]; // We might just keep the last one or full array
    last_message?: Message; // Derived helper
};

export default function AdminChatClient() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [adminId, setAdminId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setAdminId(user.id);

                const result = await getAdminConversations();
                if (result.error) {
                    console.error(result.error);
                } else if (result.conversations) {
                    // Process conversations to identify "last_message" safely
                    const processed = result.conversations.map((c: any) => {
                        // Sort messages to find the last one
                        // Supabase returns them in order usually, but let's be safe
                        const sortedMsgs = c.messages?.sort((a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        ) || [];

                        return {
                            ...c,
                            last_message: sortedMsgs[0]
                        };
                    });
                    setConversations(processed);
                    if (processed.length > 0) {
                        // Automatically select the first one? Or wait for user.
                        // Let's wait for user to select.
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        init();

        // Subscribe to NEW conversations? 
        // For simplicity, let's just subscribe to messages.
        // If a new message comes for a conversation NOT in our list, we should probably refetch or add it.
        // But for now, let's assume the list is mostly static or refreshed on reload.

        // Subscribe to ALL messages to update sidebar snippets and active chat
        const channel = supabase
            .channel('admin-global-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as Message;

                    // 1. Update active chat if match
                    if (selectedId === newMsg.conversation_id) {
                        // Use functional update to avoid stale closure if we relied on `selectedId` in a closure,
                        // but here we are in the callback. `selectedId` ref might be needed if this closure is stale.
                        // Actually `supabase.channel` subscription might be created once.
                        // Use a ref for selectedId or rely on state updater.
                        // BUT `selectedId` is inside the Effect... 
                        // To confirm: we need to verify if `selectedId` is accessible here.
                        // It is NOT accessible if the effect runs once.
                        // Code below handles this by checking `setMessages`.
                    }

                    // We need to handle state updates carefully from this single subscription.
                    handleNewMessage(newMsg);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []); // Run once

    // Helper to handle incoming realtime messages
    // effectively updating conversations list AND active messages
    const handleNewMessage = (msg: Message) => {
        setConversations(prev => {
            const exists = prev.find(c => c.id === msg.conversation_id);
            if (exists) {
                // Move to top and update last message
                const updated = { ...exists, last_message: msg };
                const others = prev.filter(c => c.id !== msg.conversation_id);
                return [updated, ...others];
            } else {
                // New conversation we didn't have? 
                // We should fetch it.
                // For now, ignore or trigger a re-fetch of all.
                return prev;
            }
        });

        // Update active messages if it matches active ID
        // We use a functional state update on `setMessages` but we need to know IF it matches.
        // We can't know `selectedId` safely here without a Ref.
        // However, `setMessages` is only relevant for the selected ID.
        // A better pattern:
        // Use a separate subscription for the active chat?
        // OR use a Ref for selectedId.
    };

    // Use a Ref to track selectedId for the realtime callback
    const selectedIdRef = useRef<string | null>(null);
    useEffect(() => {
        selectedIdRef.current = selectedId;
        if (selectedId) {
            fetchMessages(selectedId);
        }
    }, [selectedId]);

    const activeChannelRef = useRef<any>(null);

    // Fetch messages for selected conversation
    const fetchMessages = async (id: string) => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (data) {
            setMessages(data);
            scrollToBottom();
        }

        // Subscribe to this specific conversation for the chat view
        // (to ensure we get updates even if the global one is finicky, plus it's cleaner)
        if (activeChannelRef.current) supabase.removeChannel(activeChannelRef.current);

        activeChannelRef.current = supabase
            .channel(`admin-active-${id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new as Message]);
                    scrollToBottom();
                }
            )
            .subscribe();
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !selectedId || !adminId || sending) return;

        const content = input.trim();
        setInput('');
        setSending(true);

        const result = await sendMessage(selectedId, adminId, content);
        if (!result.success) {
            console.error(result.error);
        }
        setSending(false);
    };

    // Helper to get other participant
    const getOtherParticipant = (c: Conversation) => {
        return c.participants.find(p => p.user_id !== adminId)?.profile;
    };

    const filteredConversations = conversations.filter(c => {
        const other = getOtherParticipant(c);
        if (!other) return false;
        return other.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            other.email.toLowerCase().includes(search.toLowerCase());
    });

    const activeConversation = conversations.find(c => c.id === selectedId);
    const activeUser = activeConversation ? getOtherParticipant(activeConversation) : null;

    if (loading) {
        return (
            <div className="flex h-[600px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex h-[80vh] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map(c => {
                        const other = getOtherParticipant(c);
                        const isSelected = c.id === selectedId;
                        return (
                            <div
                                key={c.id}
                                onClick={() => setSelectedId(c.id)}
                                className={`p-4 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100 ${isSelected ? 'bg-white border-l-4 border-l-emerald-500 shadow-sm' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img
                                            src={other?.avatar_url || 'https://i.pravatar.cc/150?u=a'}
                                            alt="Profile"
                                            className="w-10 h-10 rounded-full object-cover bg-slate-200"
                                        />
                                        {/* Online indicator could go here */}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {other?.full_name || other?.email || 'Unknown User'}
                                            </h3>
                                            {c.last_message && (
                                                <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                    {new Date(c.last_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${isSelected ? 'text-slate-600' : 'text-slate-500'}`}>
                                            {c.last_message?.content || 'No messages'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[#efeae2]">
                {selectedId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3">
                                <img
                                    src={activeUser?.avatar_url || 'https://i.pravatar.cc/150?u=a'}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover bg-slate-200"
                                />
                                <div>
                                    <h2 className="font-semibold text-slate-800">{activeUser?.full_name || activeUser?.email}</h2>
                                    <p className="text-xs text-slate-500">{activeUser?.email}</p>
                                </div>
                            </div>
                            <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer" />
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id === adminId;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!isMe && (
                                            <img
                                                src={activeUser?.avatar_url || 'https://i.pravatar.cc/150?u=a'}
                                                alt="Avatar"
                                                className="w-8 h-8 rounded-full mr-2 self-end mb-1"
                                            />
                                        )}
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm ${isMe
                                                    ? 'bg-emerald-600 text-white rounded-tr-none'
                                                    : 'bg-white text-slate-800 rounded-tl-none'
                                                }`}
                                        >
                                            <p>{msg.content}</p>
                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                <span className="text-[10px]">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && <CheckCheck className="w-3 h-3" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-white p-4 border-t border-slate-200">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-3 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || sending}
                                    className="bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md flex items-center justify-center shrink-0"
                                >
                                    {sending ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <Send className="h-5 w-5 ml-0.5" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

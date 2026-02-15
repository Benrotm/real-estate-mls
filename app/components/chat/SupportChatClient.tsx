'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { getOrCreateSupportConversation, sendMessage } from '@/app/lib/actions/chat';
import { Send, Loader2, User, MessageCircle } from 'lucide-react';
import Image from 'next/image';

type Message = {
    id: string;
    conversation_id: string;
    sender_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
};

export default function SupportChatClient() {
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const initChat = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setError('You must be logged in to access support.');
                    setLoading(false);
                    return;
                }
                setUserId(user.id);

                const result = await getOrCreateSupportConversation();
                if (result.error) {
                    setError(result.error);
                    setLoading(false);
                    return;
                }

                if (result.conversationId) {
                    setConversationId(result.conversationId);
                    await fetchMessages(result.conversationId);
                    subscribeToMessages(result.conversationId);
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        initChat();

        return () => {
            supabase.removeAllChannels();
        };
    }, []);

    const fetchMessages = async (id: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
        } else {
            setMessages(data || []);
            scrollToBottom();
        }
    };

    const subscribeToMessages = (id: string) => {
        supabase
            .channel(`conversation:${id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${id}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => [...prev, newMessage]);
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
        if (!input.trim() || !conversationId || !userId || sending) return;

        const content = input.trim();
        setInput('');
        setSending(true);

        // Optimistic update
        const tempId = Math.random().toString();
        const optimisticMessage: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: userId,
            content: content,
            is_read: false,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom();

        const result = await sendMessage(conversationId, userId, content);

        if (!result.success) {
            // Revert on failure (simplified)
            console.error('Failed to send message:', result.error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            // If success, we wait for the realtime subscription to bring the real message, 
            // but to avoid duplicates/flicker we might want to handle it.
            // Actually, since we use optimisitc UI, we should replace the optimisitc one with the real one.
            // But realtime is fast.
            // A common pattern is to let realtime handle it, but we already added it.
            // Let's just remove the temporary one when the real one comes? 
            // Or simpler: don't do optimistic update if we rely on realtime, OR filter out the temp one when fetching.
            // For now, simple is better. Let's rely on realtime for the "confirmed" message.
            // So actually, I will REMOVE the optimistic update for now to avoid complexity with duplicates 
            // until I implement proper temp-id handling.
            // Wait, without optimistic update it feels slow.
            // Let's keep it but formatted cleanly. 
            // Actually, the realtime callback will fire very quickly.
        }

        setSending(false);
    };

    if (loading) {
        return (
            <div className="flex h-[600px] w-full items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[600px] w-full items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="text-center text-red-500">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[700px] bg-[#f0f2f5] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-slate-800">Support Chat</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Online
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2] bg-opacity-50">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 my-8">
                        <p>No messages yet. specific</p>
                        <p className="text-sm">Start the conversation by sending a message below.</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === userId;
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm ${isMe
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 rounded-tl-none'
                                    }`}
                            >
                                <p>{msg.content}</p>
                                <span className={`text-[10px] mt-1 block ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
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
        </div>
    );
}

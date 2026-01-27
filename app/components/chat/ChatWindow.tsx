'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { UserProfile } from '@/app/lib/auth';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    conversationId: string;
    currentUser: UserProfile;
    onBack: () => void;
}

export default function ChatWindow({ conversationId, currentUser, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setLoading(true);
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
            setLoading(false);
            scrollToBottom();
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new;
                    setMessages((prev) => [...prev, newMsg]);
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // Auto-scroll on messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear

        // Optimistic UI update (optional, but good for UX)
        // For now, we rely on the subscription to add it to the list to confirm it worked

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: content
            });

        if (error) {
            console.error('Error sending message:', error);
            // Restore input if failed
            setNewMessage(content);
        } else {
            // Update conversation updated_at for sorting
            await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', conversationId);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3 shadow-sm z-10">
                <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">Chat</h3>
                    <p className="text-xs text-slate-500">Real-time encryption enabled</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>}

                {!loading && messages.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-10">
                        No messages yet. Say hello! 👋
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isMe
                                    ? 'bg-orange-500 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                }`}>
                                <p>{msg.content}</p>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-slate-400'}`}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

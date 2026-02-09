'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { UserProfile } from '@/app/lib/auth';
import { Send, ArrowLeft, Loader2, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface ChatWindowProps {
    conversationId: string;
    currentUser: UserProfile;
    onBack?: () => void;
}

export default function ChatWindow({ conversationId, currentUser, onBack }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedAttachments, setUploadedAttachments] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            // 1. Fetch other participant's info
            const { data: participants } = await supabase
                .from('conversation_participants')
                .select('user_id, user:user_id(full_name, email, role, avatar_url)')
                .eq('conversation_id', conversationId);

            if (participants) {
                const other = participants.find(p => p.user_id !== currentUser.id);
                setOtherUser(other?.user || participants[0]?.user);
            }

            // 2. Fetch messages
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
            setLoading(false);
            scrollToBottom();
        };

        fetchData();

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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setIsUploading(true);
        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${conversationId}/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('support-attachments')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('support-attachments')
                .getPublicUrl(filePath);

            setUploadedAttachments(prev => [...prev, publicUrl]);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (indexToRemove: number) => {
        setUploadedAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && uploadedAttachments.length === 0) return;

        const content = newMessage.trim();
        const attachments = [...uploadedAttachments];

        setNewMessage('');
        setUploadedAttachments([]);

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: content,
                attachments: attachments
            });

        if (error) {
            console.error('Error sending message:', error);
            // Restore input if failed
            setNewMessage(content);
            setUploadedAttachments(attachments);
        } else {
            // Update conversation updated_at for sorting
            await supabase.from('conversations').update({ updated_at: new Date() }).eq('id', conversationId);
        }
    };

    // CSS for the background pattern (subtle geometric)
    const backgroundStyle = {
        backgroundColor: '#e5ddd5',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239c92ac' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
    };

    return (
        <div className="flex flex-col h-full relative" style={backgroundStyle}>
            {/* Glassmorphic Header */}
            <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-white/20 flex items-center gap-3 shadow-sm z-20 sticky top-0 transition-all duration-300">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="relative">
                    {otherUser?.avatar_url ? (
                        <img src={otherUser.avatar_url} alt={otherUser.full_name || 'User'} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-sm">
                            {(otherUser?.full_name || otherUser?.email || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 leading-tight">
                        {otherUser?.full_name || otherUser?.email || 'Support Team'}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                        {otherUser?.role ? otherUser.role.replace('_', ' ') : 'Online'}
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 scroll-smooth">
                {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>}

                {!loading && messages.length === 0 && (
                    <div className="text-center py-10 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-2">👋</div>
                        <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/50">
                            <p className="text-sm text-slate-600 font-medium">How can we help you today?</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const hasAttachments = msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0;

                    // Grouping logic: check if previous message was same sender
                    const isSequence = index > 0 && messages[index - 1].sender_id === msg.sender_id;
                    const isLastInSequence = index === messages.length - 1 || messages[index + 1].sender_id !== msg.sender_id;

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1`}>
                            <div className={`flex flex-col max-w-[85%] sm:max-w-[70%] relative ${isMe ? 'items-end' : 'items-start'}`}>

                                <div className={`
                                    relative px-3 py-2 sm:px-4 sm:py-2 text-[15px] shadow-sm
                                    ${isMe
                                        ? 'bg-violet-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm'
                                    }
                                    ${!isLastInSequence && isMe ? 'rounded-br-md mb-[2px]' : ''}
                                    ${!isLastInSequence && !isMe ? 'rounded-bl-md mb-[2px]' : ''}
                                `}>

                                    {/* Tail SVG for visual flair on the first message of a sequence, or standalone */}
                                    {!isSequence && (
                                        <svg
                                            className={`absolute top-0 w-3 h-3 ${isMe ? '-right-[8px] fill-violet-600' : '-left-[8px] fill-white'}`}
                                            viewBox="0 0 10 10" preserveAspectRatio="none">
                                            <path d={isMe ? "M0,0 L10,0 L0,10 Z" : "M0,0 L10,0 L10,10 Z"} />
                                        </svg>
                                    )}

                                    {hasAttachments && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {msg.attachments.map((url: string, idx: number) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative block h-40 w-full sm:w-64 rounded-lg overflow-hidden border border-black/5">
                                                    <Image
                                                        src={url}
                                                        alt="Attachment"
                                                        fill
                                                        className="object-cover hover:scale-105 transition-transform duration-500"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {msg.content && (
                                        <p className="whitespace-pre-wrap leading-relaxed break-words pb-1 pr-2 relative z-10">{msg.content}</p>
                                    )}

                                    <div className={`text-[10px] flex items-center justify-end gap-1 opacity-70 ${isMe ? 'text-violet-100' : 'text-slate-400'} mt-1`}>
                                        <span>{format(new Date(msg.created_at), 'h:mm a')}</span>
                                        {isMe && (
                                            <span className="font-bold tracking-tighter text-[11px]">
                                                {/* Simulate read receipt - in real app check msg.is_read */}
                                                ✓✓
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-transparent sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">

                    {/* File Preview */}
                    {uploadedAttachments.length > 0 && (
                        <div className="flex gap-2 mx-2 p-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-x-auto w-fit max-w-full">
                            {uploadedAttachments.map((url, idx) => (
                                <div key={idx} className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 group">
                                    <Image src={url} alt="Upload preview" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => removeAttachment(idx)}
                                            className="bg-red-500 p-1 rounded-full text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSend} className="flex gap-2 items-end">

                        <div className="flex-1 flex gap-2 items-end bg-white rounded-[26px] shadow-lg border border-slate-100 px-2 py-2 relative z-20">

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all duration-200"
                                disabled={isUploading}
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                            </button>

                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                                placeholder="Message support..."
                                className="w-full py-2.5 max-h-32 bg-transparent border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 resize-none"
                                rows={1}
                                style={{ minHeight: '44px' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && uploadedAttachments.length === 0) || isUploading}
                            className="p-3 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center w-12 h-12"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

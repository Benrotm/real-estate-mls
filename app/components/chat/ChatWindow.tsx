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

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3 shadow-sm z-10 sticky top-0">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800">Support Chat</h3>
                    <p className="text-xs text-slate-500">Typical reply time: Few hours</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>}

                {!loading && messages.length === 0 && (
                    <div className="text-center text-sm text-slate-400 py-10 flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl">👋</div>
                        <p>How can we help you today?</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const hasAttachments = msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0;

                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 shadow-sm text-sm ${isMe
                                    ? 'bg-violet-600 text-white rounded-2xl rounded-tr-none'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none'
                                    }`}>

                                    {hasAttachments && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.attachments.map((url: string, idx: number) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative block h-32 w-full rounded-lg overflow-hidden border border-white/20">
                                                    <Image
                                                        src={url}
                                                        alt="Attachment"
                                                        fill
                                                        className="object-cover hover:scale-105 transition-transform"
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                </div>
                                <div className={`text-[10px] px-1 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200">
                {/* File Preview */}
                {uploadedAttachments.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {uploadedAttachments.map((url, idx) => (
                            <div key={idx} className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
                                <Image src={url} alt="Upload preview" fill className="object-cover" />
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2 items-end">
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
                        className="p-3 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a message..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all text-sm resize-none max-h-32"
                            rows={1}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && uploadedAttachments.length === 0) || isUploading}
                        className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

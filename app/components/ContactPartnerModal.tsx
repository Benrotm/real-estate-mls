'use client';

import { useState, useRef } from 'react';
import { X, MessageSquare, Loader2, Check } from 'lucide-react';
import { sendMessage, startConversationWithUser } from '../lib/actions/chat';

interface ContactPartnerModalProps {
    isOpen: boolean;
    onClose: () => void;
    partnerId: string;
    partnerName: string;
    defaultMessage: string;
    currentUserEmail: string | null;
    currentUserId: string | null;
}

export default function ContactPartnerModal({
    isOpen,
    onClose,
    partnerId,
    partnerName,
    defaultMessage,
    currentUserEmail,
    currentUserId
}: ContactPartnerModalProps) {
    const [message, setMessage] = useState(defaultMessage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const isSubmitting = useRef(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting.current) return;
        isSubmitting.current = true;

        setIsLoading(true);
        setError('');

        try {
            if (!message.trim()) {
                throw new Error('Please enter a message.');
            }

            const { conversationId, error: chatError } = await startConversationWithUser(partnerId);
            if (chatError) throw new Error(chatError);

            if (conversationId) {
                if (!currentUserId) throw new Error('You must be logged in to send messages.');
                const { error: sendError } = await sendMessage(conversationId, currentUserId, message);
                if (sendError) throw new Error(sendError as string);

                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    isSubmitting.current = false;
                }, 2000);
            }
        } catch (err: any) {
            setError(err.message);
            isSubmitting.current = false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Contact Partner</h3>
                            <p className="text-xs text-slate-500 font-medium">Message to {partnerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h4>
                            <p className="text-slate-500">Your collaboration request has been sent to {partnerName}.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Collaboration Message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={4}
                                    className="block w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-slate-900 text-sm resize-none bg-slate-50"
                                    placeholder="Write your message here..."
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-slate-600 hover:bg-gray-50 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 px-4 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <MessageSquare className="w-4 h-4 fill-current" />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}


'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface ShareButtonProps {
    title: string;
    description?: string;
    url?: string;
    className?: string;
}

export default function ShareButton({ title, description, url, className = '' }: ShareButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== 'undefined' ? (url || window.location.href) : '';
    const shareText = description || `Check out this property: ${title}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            setIsOpen(!isOpen);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium shadow-sm"
                aria-label="Share this property"
            >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
            </button>

            {/* Fallback Dropdown for Desktop */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                        <div className="text-xs font-bold text-slate-400 uppercase px-3 py-2">
                            Share via
                        </div>

                        <div className="space-y-1">
                            {/* WhatsApp */}
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-green-600 rounded-lg transition-colors w-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp</span>
                            </a>

                            {/* Facebook */}
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors w-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <Facebook className="w-4 h-4" />
                                <span>Facebook</span>
                            </a>

                            {/* Twitter / X */}
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-sky-500 rounded-lg transition-colors w-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <Twitter className="w-4 h-4" />
                                <span>Twitter</span>
                            </a>

                            {/* Email */}
                            <a
                                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`}
                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors w-full"
                                onClick={() => setIsOpen(false)}
                            >
                                <Mail className="w-4 h-4" />
                                <span>Email</span>
                            </a>
                        </div>

                        <div className="h-px bg-slate-100 my-2" />

                        {/* Copy Link */}
                        <button
                            onClick={copyToClipboard}
                            className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors w-full"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-green-600 font-medium">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Link</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

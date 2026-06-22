'use client';

import { useState, useEffect, useTransition } from 'react';
import { Share2, Plus, Trash2, Save, ExternalLink, Loader2 } from 'lucide-react';
import { getSocialLinks, updateSocialLinks } from '@/app/lib/actions/settings';

const CHANNELS = [
    {
        key: 'whatsapp_groups',
        label: 'WhatsApp Groups',
        color: 'emerald',
        description: 'Add WhatsApp group invite links or chat links',
        placeholder: 'https://chat.whatsapp.com/...',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
        ),
    },
    {
        key: 'facebook_groups',
        label: 'Facebook Groups',
        color: 'blue',
        description: 'Add Facebook group links for property sharing',
        placeholder: 'https://www.facebook.com/groups/...',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
        ),
    },
    {
        key: 'facebook_page',
        label: 'Facebook Page',
        color: 'sky',
        description: 'Add Facebook page links for property publishing',
        placeholder: 'https://www.facebook.com/YourPage',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
        ),
    },
    {
        key: 'instagram',
        label: 'Instagram Page',
        color: 'pink',
        description: 'Add Instagram page or profile links',
        placeholder: 'https://www.instagram.com/YourPage',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
        ),
    },
    {
        key: 'tiktok',
        label: 'TikTok Page',
        color: 'slate',
        description: 'Add TikTok profile or page links',
        placeholder: 'https://www.tiktok.com/@YourPage',
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
        ),
    },
];

const colorMap: Record<string, { bg: string; border: string; text: string; hoverBorder: string; inputFocus: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', hoverBorder: 'hover:border-emerald-500/50', inputFocus: 'focus:border-emerald-500' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-500', hoverBorder: 'hover:border-blue-500/50', inputFocus: 'focus:border-blue-500' },
    sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', hoverBorder: 'hover:border-sky-500/50', inputFocus: 'focus:border-sky-500' },
    pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-500', hoverBorder: 'hover:border-pink-500/50', inputFocus: 'focus:border-pink-500' },
    slate: { bg: 'bg-slate-700/20', border: 'border-slate-600/30', text: 'text-slate-200', hoverBorder: 'hover:border-slate-500/50', inputFocus: 'focus:border-slate-400' },
};

export default function SocialSettingsPage() {
    const [links, setLinks] = useState<Record<string, string[]>>({});
    const [newInputs, setNewInputs] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [savedMessage, setSavedMessage] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await getSocialLinks();
            if (res.links) {
                setLinks(res.links);
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const handleAddLink = (channelKey: string) => {
        const url = (newInputs[channelKey] || '').trim();
        if (!url) return;
        
        // Basic URL validation
        try {
            new URL(url);
        } catch {
            alert('Please enter a valid URL');
            return;
        }

        setLinks(prev => ({
            ...prev,
            [channelKey]: [...(prev[channelKey] || []), url],
        }));
        setNewInputs(prev => ({ ...prev, [channelKey]: '' }));
    };

    const handleRemoveLink = (channelKey: string, index: number) => {
        setLinks(prev => ({
            ...prev,
            [channelKey]: (prev[channelKey] || []).filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateSocialLinks(links);
            if (res.error) {
                alert('Error saving: ' + res.error);
            } else {
                setSavedMessage(true);
                setTimeout(() => setSavedMessage(false), 3000);
            }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg font-medium">Loading social media settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                            <div className="p-2 bg-pink-500/10 rounded-xl border border-pink-500/20">
                                <Share2 className="w-7 h-7 text-pink-500" />
                            </div>
                            Social Media Links
                        </h1>
                        <p className="text-slate-400 max-w-2xl">
                            Manage sharing links for each social media channel. When users select these channels during property listing,
                            they will be shown these links to share their listing manually.
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-pink-600/20 border border-pink-500/20 shrink-0"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : savedMessage ? (
                            <>
                                <svg className="w-5 h-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Settings
                            </>
                        )}
                    </button>
                </header>

                {/* Channel Cards */}
                <div className="space-y-6">
                    {CHANNELS.map(channel => {
                        const colors = colorMap[channel.color];
                        const channelLinks = links[channel.key] || [];

                        return (
                            <section
                                key={channel.key}
                                className={`bg-slate-900 border ${colors.border} rounded-xl p-6 shadow-xl transition-colors ${colors.hoverBorder}`}
                            >
                                {/* Channel Header */}
                                <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
                                    <div className={`p-2.5 ${colors.bg} ${colors.text} rounded-lg`}>
                                        {channel.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            {channel.label}
                                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                                                {channelLinks.length} link{channelLinks.length !== 1 ? 's' : ''}
                                            </span>
                                        </h2>
                                        <p className="text-sm text-slate-500">{channel.description}</p>
                                    </div>
                                </div>

                                {/* Existing Links */}
                                {channelLinks.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {channelLinks.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 group hover:border-slate-700 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="text-sm text-slate-300 truncate flex-1 font-mono">
                                                    {url}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveLink(channel.key, idx)}
                                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                    title="Remove link"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Link */}
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newInputs[channel.key] || ''}
                                        onChange={e => setNewInputs(prev => ({ ...prev, [channel.key]: e.target.value }))}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink(channel.key); } }}
                                        placeholder={channel.placeholder}
                                        className={`flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none ${colors.inputFocus} transition-colors placeholder:text-slate-600 font-mono`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddLink(channel.key)}
                                        className={`${colors.bg} ${colors.text} border ${colors.border} px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-1.5 hover:brightness-125 transition-all shrink-0`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add
                                    </button>
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Bottom Save Button */}
                <div className="flex justify-end pt-4 pb-8">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-pink-600/20 border border-pink-500/20"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Save All Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

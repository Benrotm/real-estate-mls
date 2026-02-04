'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { User, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
    userId: string;
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ConversationList({ userId, selectedId, onSelect }: ConversationListProps) {
    const [creating, setCreating] = useState(false);

    const fetchConversations = async () => {
        setLoading(true);
        // 1. Get IDs of conversations this user is in
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (!myConvos || myConvos.length === 0) {
            setLoading(false);
            return;
        }

        const ids = myConvos.map(c => c.conversation_id);

        // 2. Fetch conversation details + participants
        // Order by created_at ASC to number them 1, 2, 3...
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id, 
                created_at,
                updated_at,
                conversation_participants (
                    user_id,
                    user:user_id ( full_name, role )
                )
            `)
            .in('id', ids)
            .order('created_at', { ascending: true });

        if (data) {
            setConversations(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();

        // Subscribe to changes (e.g. new message bumping timestamp)
        // ideally we subscribe to 'conversations' table too
    }, [userId]);

    const handleCreateNew = async () => {
        setCreating(true);
        const { createNewSupportConversation } = await import('@/app/lib/actions/chat');
        const result = await createNewSupportConversation();
        if (result.conversationId) {
            await fetchConversations(); // Refresh list
            onSelect(result.conversationId); // Select new one
        }
        setCreating(false);
    };

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800">Messages</h2>
                <button
                    onClick={handleCreateNew}
                    disabled={creating}
                    className="p-1.5 bg-violet-600 text-white rounded-full hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
                    title="New Conversation"
                >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">No conversations yet.</div>
                )}

                {conversations.map((conv, index) => (
                    <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedId === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 font-bold text-xs">
                            {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={`font-bold truncate ${selectedId === conv.id ? 'text-orange-900' : 'text-slate-900'}`}>Conversation {index + 1}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">Support Query</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

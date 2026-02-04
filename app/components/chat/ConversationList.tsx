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
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            // This query is complex: fetch conversations where user is a participant
            // We need to join with conversation_participants again to get the OTHER user(s)

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

            // 2. Fetch conversation details + participants + last message (if feasible)
            // For simplicity, we just fetch participants and sort by updated_at
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    id, 
                    updated_at,
                    conversation_participants (
                        user_id,
                        user:user_id ( full_name, role )
                    )
                `)
                .in('id', ids)
                .order('updated_at', { ascending: false });

            if (data) {
                // Enhance data to identify "The Other Person" name
                const enhanced = data.map((c: any) => {
                    const otherParticipant = c.conversation_participants.find((p: any) => p.user_id !== userId);
                    return {
                        ...c,
                        title: otherParticipant?.user?.full_name || 'Unknown User',
                        subtitle: otherParticipant?.user?.role || 'User'
                    };
                });
                setConversations(enhanced);
            }
            setLoading(false);
        };

        fetchConversations();

        // Realtime subscription for NEW conversations could go here
    }, [userId]);

    if (loading) {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
    }

    if (conversations.length === 0) {
        return <div className="p-4 text-center text-sm text-slate-500">No conversations yet.</div>;
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedId === conv.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className={`font-bold truncate ${selectedId === conv.id ? 'text-orange-900' : 'text-slate-900'}`}>{conv.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{conv.subtitle}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}

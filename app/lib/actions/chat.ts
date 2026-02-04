'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

export async function getOrCreateSupportConversation() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Find a Super Admin
        const { data: superAdmins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1);

        if (!superAdmins || superAdmins.length === 0) {
            return { error: 'No support staff available.' };
        }

        const supportAgentId = superAdmins[0].id;

        // Check if conversation exists
        const { data: userConversations } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        const conversationIds = userConversations?.map(c => c.conversation_id) || [];

        if (conversationIds.length > 0) {
            const { data: existing } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .in('conversation_id', conversationIds)
                .eq('user_id', supportAgentId)
                .limit(1)
                .single();

            if (existing) {
                return { conversationId: existing.conversation_id };
            }
        }

        // Create new conversation
        // Use admin client to bypass RLS policies
        const supabaseAdmin = createAdminClient();

        const { data: newConv, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (createError) {
            console.error('Create conversation error:', createError);
            return { error: 'Failed to create conversation: ' + createError.message };
        }

        if (!newConv) {
            return { error: 'Failed to create conversation: No data returned.' };
        }

        // Add participants
        const { error: partError } = await supabaseAdmin.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: supportAgentId }
        ]);

        if (partError) {
            console.error('Add participant error:', partError);
            return { error: 'Failed to add participants: ' + partError.message };
        }

        return { conversationId: newConv.id };
    } catch (e: any) {
        console.error('Unexpected error in getOrCreateSupportConversation:', e);
        return { error: 'Unexpected error: ' + e.message };
    }
}

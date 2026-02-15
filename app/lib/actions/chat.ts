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

export async function createNewSupportConversation() {
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

        // Create NEW conversation ALWAYS (do not check existing)
        const supabaseAdmin = createAdminClient();
        const { data: newConv, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (createError) throw createError;

        // Add participants
        const { error: partError } = await supabaseAdmin.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: user.id },
            { conversation_id: newConv.id, user_id: supportAgentId }
        ]);

        if (partError) throw partError;

        return { conversationId: newConv.id };
        return { conversationId: newConv.id };
    } catch (e: any) {
        console.error('Create specific conversation error:', e);
        return { error: 'Failed to create conversation' };
    }
}

export async function startConversationByEmail(email: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // 1. Find target user by email
        const { data: targetUser, error: findError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .eq('email', email)
            .single();

        if (findError || !targetUser) {
            return { error: 'User not found with that email.' };
        }

        if (targetUser.id === user.id) {
            return { error: 'You cannot chat with yourself.' };
        }

        // 2. Check if conversation already exists
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

        if (myConvoIds.length > 0) {
            const { data: existing } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .in('conversation_id', myConvoIds)
                .eq('user_id', targetUser.id)
                .limit(1)
                .single();

            if (existing) {
                return { conversationId: existing.conversation_id };
            }
        }

        // 3. Create new conversation using ADMIN client (bypass RLS for participants)
        const supabaseAdmin = createAdminClient();

        const { data: newConv, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (createError) throw createError;

        // 4. Add both participants
        const { error: partError } = await supabaseAdmin
            .from('conversation_participants')
            .insert([
                { conversation_id: newConv.id, user_id: user.id },
                { conversation_id: newConv.id, user_id: targetUser.id }
            ]);

        if (partError) throw partError;

        return { conversationId: newConv.id };

    } catch (e: any) {
        console.error('startConversationByEmail error:', e);
        return { error: e.message };
    }
}

export async function startConversationWithUser(targetUserId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        if (targetUserId === user.id) {
            return { error: 'You cannot chat with yourself.' };
        }

        // 1. Check if conversation already exists
        const { data: myConvos } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', user.id);

        const myConvoIds = myConvos?.map(c => c.conversation_id) || [];

        if (myConvoIds.length > 0) {
            // Use admin client to ensure we can see other participants regardless of RLS
            const supabaseAdmin = createAdminClient();

            const { data: existing } = await supabaseAdmin
                .from('conversation_participants')
                .select('conversation_id')
                .in('conversation_id', myConvoIds)
                .eq('user_id', targetUserId)
                .limit(1)
                .single();

            if (existing) {
                return { conversationId: existing.conversation_id };
            }
        }

        // 2. Create new conversation using ADMIN client (bypass RLS for participants)
        const supabaseAdmin = createAdminClient();

        const { data: newConv, error: createError } = await supabaseAdmin
            .from('conversations')
            .insert({})
            .select()
            .single();

        if (createError) throw createError;

        // 3. Add both participants
        const { error: partError } = await supabaseAdmin
            .from('conversation_participants')
            .insert([
                { conversation_id: newConv.id, user_id: user.id },
                { conversation_id: newConv.id, user_id: targetUserId }
            ]);

        if (partError) throw partError;

        return { conversationId: newConv.id };

    } catch (e: any) {
        console.error('startConversationWithUser error:', e);
        return { error: e.message };
    }
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
    try {
        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content
            });

        if (error) throw error;

        // Update conversation updated_at
        await supabaseAdmin
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        return { success: true };
    } catch (error: any) {
        console.error('sendMessage error:', error);
        return { success: false, error: error.message };
    }
}

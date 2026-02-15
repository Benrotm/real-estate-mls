'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

export type Message = {
    id: string;
    conversation_id: string;
    sender_id: string | null;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        full_name: string | null;
        avatar_url: string | null;
        email: string;
    };
};

export type Conversation = {
    id: string;
    created_at: string;
    updated_at: string;
    participants: {
        user_id: string;
        profile: {
            full_name: string | null;
            avatar_url: string | null;
            email: string;
        };
    }[];
    last_message?: Message;
};

export async function getOrCreateSupportConversation() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Find a Super Admin
        let { data: superAdmins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1);

        if (!superAdmins || superAdmins.length === 0) {
            // Fallback to any admin if no super_admin
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1);

            if (!admins || admins.length === 0) {
                return { error: 'No support staff available.' };
            }
            // Use the first admin found
            superAdmins = [admins[0]];
        }

        const supportAgentId = superAdmins![0].id;

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
        let { data: superAdmins } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'super_admin')
            .limit(1);

        if (!superAdmins || superAdmins.length === 0) {
            // Fallback to any admin if no super_admin
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1);

            if (!admins || admins.length === 0) {
                return { error: 'No support staff available.' };
            }
            // Use the first admin found
            superAdmins = [admins[0]];
        }

        const supportAgentId = superAdmins![0].id;

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
        const supabase = await createClient(); // Use regular client to respect RLS

        // Check if user is participant
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== senderId) return { error: 'Unauthorized' };

        const { error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content
            });

        if (error) throw error;

        // Update conversation updated_at
        // We might need admin client here if RLS prevents update, but usually participants can update?
        // Let's use admin client for the update to be safe and simple
        const supabaseAdmin = createAdminClient();
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

export async function getAdminConversations() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { error: 'Unauthorized' };

        // Fetch conversations where the current user (admin) is a participant
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select(`
                *,
                participants:conversation_participants(
                    user_id,
                    profile:profiles(
                        full_name,
                        avatar_url,
                        email
                    )
                ),
                messages(
                    content,
                    created_at,
                    is_read,
                    sender_id
                )
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return { conversations };

    } catch (error: any) {
        console.error('getAdminConversations error:', error);
        return { error: error.message };
    }
}

export async function getUserSupportConversation() {
    try {
        // Wrapper for getOrCreateSupportConversation to return full object if needed, 
        // or just rely on the client to fetch details after getting ID.
        // For now, let's just return the ID and then the client can subscribe.
        return await getOrCreateSupportConversation();
    } catch (e: any) {
        return { error: e.message };
    }
}

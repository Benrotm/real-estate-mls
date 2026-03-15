'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'lead' | 'message' | 'offer' | 'inquiry' | 'system';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    content?: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

/**
 * Create a new notification for a specific user.
 * Usually called from other server actions (offer, inquiry, chat).
 */
export async function createNotification(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    content?: string;
    link?: string;
}) {
    const supabase = createAdminClient();

    const { data: notification, error } = await supabase
        .from('notifications')
        .insert([data])
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: notification };
}

/**
 * Fetch unread notifications count for the current user.
 */
export async function getUnreadNotificationsCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error counting notifications:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Fetch recent notifications for the current user.
 */
export async function getNotifications(limit = 20) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data as Notification[];
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Use Admin Client to bypass RLS issues on update if necessary
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', user.id); // Extra safety check

    if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

/**
 * Mark all notifications for the current user as read.
 */
export async function markAllNotificationsAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Use Admin Client for bulk updates
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

/**
 * Mark all notifications of specific types for the current user as read.
 */
export async function markAllNotificationsByTypeAsRead(types: NotificationType[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Use Admin Client to bypass any potentially restrictive RLS on UPDATE
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('type', types)
        .eq('is_read', false);

    if (error) {
        console.error('[Notifications] Error marking notifications by type as read:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

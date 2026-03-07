'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Loader2, MessageSquare, DollarSign, Users, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase/client';
import { getNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/app/lib/actions/notifications';

export default function NotificationBell({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        const [list, count] = await Promise.all([
            getNotifications(10),
            getUnreadNotificationsCount()
        ]);
        setNotifications(list);
        setUnreadCount(count);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!userId) return;

        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`user-notifications-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);
                    // Play subtle sound or show toast? (Optional)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    // Re-fetch to be safe when something is marked as read elsewhere
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'message': return <MessageSquare className="w-4 h-4 text-blue-500" />;
            case 'offer': return <DollarSign className="w-4 h-4 text-green-500" />;
            case 'inquiry': return <Users className="w-4 h-4 text-orange-500" />;
            case 'lead': return <Info className="w-4 h-4 text-cyan-500" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#1e293b]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-0 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                                >
                                    <CheckCircle2 className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {isLoading && notifications.length === 0 ? (
                                <div className="p-8 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors relative group ${!notification.is_read ? 'bg-orange-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm font-bold truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                                                    {notification.content}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                                        {new Date(notification.created_at).toLocaleDateString()}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => {
                                                                setIsOpen(false);
                                                                handleMarkAsRead(notification.id);
                                                            }}
                                                            className="text-[10px] font-bold text-orange-500 hover:underline"
                                                        >
                                                            View Details
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white shadow-sm border border-slate-200 rounded text-slate-400 hover:text-slate-600"
                                                title="Mark as read"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="block p-3 text-center text-xs font-bold text-slate-500 border-t border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                View All Notifications
                            </Link>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

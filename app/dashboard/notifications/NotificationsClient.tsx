'use client';

import { useState, useTransition } from 'react';
import { 
    MessageSquare, 
    Coins, 
    Users, 
    HelpCircle, 
    ShieldAlert, 
    Bell,
    Check,
    CheckCheck,
    ArrowRight,
    Inbox,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { markNotificationAsRead, markAllNotificationsAsRead, Notification } from '@/app/lib/actions/notifications';
import { useRouter } from 'next/navigation';

interface NotificationsClientProps {
    initialNotifications: Notification[];
}

function getRelativeTime(dateString: string) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Chiar acum';
        if (diffMins < 60) return `Acum ${diffMins} min`;
        if (diffHours < 24) return `Acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
        if (diffDays === 1) return 'Ieri';
        if (diffDays < 7) return `Acum ${diffDays} zile`;
        
        return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

const typeConfig = {
    message: {
        icon: MessageSquare,
        color: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/25',
        label: 'Mesaje'
    },
    offer: {
        icon: Coins,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/25',
        label: 'Oferte'
    },
    lead: {
        icon: Users,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/25',
        label: 'Leads'
    },
    inquiry: {
        icon: HelpCircle,
        color: 'text-violet-500 bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/25',
        label: 'Inquiries'
    },
    system: {
        icon: ShieldAlert,
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/25',
        label: 'Sistem'
    }
};

export default function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | Notification['type']>('all');
    const [isPending, startTransition] = useTransition();

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );

        startTransition(async () => {
            const res = await markNotificationAsRead(id);
            if (!res.success) {
                // Rollback if failed
                setNotifications(initialNotifications);
            } else {
                router.refresh();
            }
        });
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        startTransition(async () => {
            const res = await markAllNotificationsAsRead();
            if (!res.success) {
                // Rollback if failed
                setNotifications(initialNotifications);
            } else {
                router.refresh();
            }
        });
    };

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        const matchesReadFilter = 
            filter === 'all' || 
            (filter === 'unread' && !n.is_read) || 
            (filter === 'read' && n.is_read);
            
        const matchesTypeFilter = 
            typeFilter === 'all' || 
            n.type === typeFilter;

        return matchesReadFilter && matchesTypeFilter;
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-6 h-6 text-orange-500" /> Centru de Notificări
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Gestionați și vizualizați toate alertele și mesajele dumneavoastră. {unreadCount > 0 && (
                            <span className="font-bold text-orange-500">({unreadCount} necitite)</span>
                        )}
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={isPending}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition duration-200 cursor-pointer disabled:opacity-50"
                    >
                        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                        Marchează toate ca citite
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                {/* Read Status Filters */}
                <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-full md:w-auto">
                    {(['all', 'unread', 'read'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition ${
                                filter === tab 
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
                            }`}
                        >
                            {tab === 'all' ? 'Toate' : tab === 'unread' ? 'Necitite' : 'Citite'}
                        </button>
                    ))}
                </div>

                {/* Type Filters */}
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                            typeFilter === 'all'
                                ? 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold'
                                : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        Toate Tipurile
                    </button>
                    {(Object.keys(typeConfig) as Notification['type'][]).map(type => {
                        const config = typeConfig[type];
                        const count = notifications.filter(n => n.type === type && (filter === 'all' || (filter === 'unread' && !n.is_read) || (filter === 'read' && n.is_read))).length;
                        if (count === 0 && typeFilter !== type) return null; // Hide type filters with 0 items for clarity

                        return (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                                    typeFilter === type
                                        ? 'bg-orange-50/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 font-bold'
                                        : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                                <span className="text-[10px] opacity-75 font-mono">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
                        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Inbox className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Nu am găsit notificări</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                                Nu există notificări care să corespundă filtrelor selectate în acest moment.
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredNotifications.map(notification => {
                        const config = typeConfig[notification.type] || {
                            icon: Bell,
                            color: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-100 dark:border-slate-500/20',
                            label: 'Notificare'
                        };
                        const Icon = config.icon;

                        return (
                            <div
                                key={notification.id}
                                className={`group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm hover:shadow transition-all duration-300 flex items-start gap-4 ${
                                    !notification.is_read ? 'border-l-4 border-l-orange-500' : ''
                                }`}
                            >
                                {/* Type Icon */}
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.color} transition-transform group-hover:scale-105 duration-300`}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                {/* Content */}
                                <div className="space-y-1 flex-1 min-w-0 pr-8">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                                            {config.label}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-medium text-slate-400" title={notification.created_at}>
                                            {getRelativeTime(notification.created_at)}
                                        </span>
                                    </div>

                                    <h3 className={`text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug truncate ${
                                        !notification.is_read ? 'font-black text-slate-900 dark:text-white' : ''
                                    }`}>
                                        {notification.title}
                                    </h3>

                                    {notification.content && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {notification.content}
                                        </p>
                                    )}

                                    {/* Action Link */}
                                    {notification.link && (
                                        <div className="pt-2">
                                            <Link
                                                href={notification.link}
                                                className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-orange-500 hover:text-orange-600 transition"
                                            >
                                                Vezi detalii <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Read/Unread Indicators and Actions */}
                                <div className="absolute top-5 right-5 flex items-center gap-2">
                                    {!notification.is_read ? (
                                        <button
                                            onClick={() => handleMarkAsRead(notification.id)}
                                            className="p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-orange-500 transition-colors flex items-center justify-center cursor-pointer"
                                            title="Marchează ca citit"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" title="Citit" />
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

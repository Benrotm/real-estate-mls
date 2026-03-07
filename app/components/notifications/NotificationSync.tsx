'use client';

import { useEffect } from 'react';
import { markAllNotificationsByTypeAsRead, NotificationType } from '@/app/lib/actions/notifications';

interface NotificationSyncProps {
    types: NotificationType[];
}

export default function NotificationSync({ types }: NotificationSyncProps) {
    useEffect(() => {
        markAllNotificationsByTypeAsRead(types);
    }, [types]);

    return null;
}

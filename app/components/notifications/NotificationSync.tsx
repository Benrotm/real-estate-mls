'use client';

import { useEffect } from 'react';
import { markAllNotificationsByTypeAsRead, NotificationType } from '@/app/lib/actions/notifications';
import { useRouter } from 'next/navigation';

interface NotificationSyncProps {
    types: NotificationType[];
}

export default function NotificationSync({ types }: NotificationSyncProps) {
    const router = useRouter();

    useEffect(() => {
        const sync = async () => {
            await markAllNotificationsByTypeAsRead(types);
            router.refresh();
        };
        sync();
    }, [JSON.stringify(types)]);

    return null;
}

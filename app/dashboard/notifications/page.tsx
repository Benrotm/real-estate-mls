import { getNotifications } from '@/app/lib/actions/notifications';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
    const notifications = await getNotifications(100);

    return (
        <NotificationsClient initialNotifications={notifications} />
    );
}

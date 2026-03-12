import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import MarketAnalyticsClient from '@/app/components/analytics/MarketAnalyticsClient';

export default async function OwnerAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <MarketAnalyticsClient role="owner" userRole="owner" userId={user.id} />;
}

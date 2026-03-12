import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import MarketAnalyticsClient from '@/app/components/analytics/MarketAnalyticsClient';

export default async function AdminAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Role check if needed, but middleware usually handles this

    return <MarketAnalyticsClient role="admin" userRole="admin" userId={user.id} />;
}

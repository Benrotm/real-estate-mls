import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import MarketAnalyticsClient from '@/app/components/analytics/MarketAnalyticsClient';

export default async function ClientAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <MarketAnalyticsClient role="client" userRole="client" userId={user.id} />;
}

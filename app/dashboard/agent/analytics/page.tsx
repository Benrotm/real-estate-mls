import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import MarketAnalyticsClient from '@/app/components/analytics/MarketAnalyticsClient';

export default async function AgentAnalyticsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return <MarketAnalyticsClient role="agent" userRole="agent" userId={user.id} />;
}

import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { redirect } from 'next/navigation';

export default async function MarketInsightsPage() {
    if (!await hasFeature(SYSTEM_FEATURES.MARKET_INSIGHTS)) {
        redirect('/dashboard?error=upgrade_required_market');
    }

    return (
        <div className="max-w-7xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-slate-900">Market Insights</h1>
            <p className="text-slate-500 mt-2">Exclusive market trends and data.</p>
            <div className="mt-8 p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">Market data graphs coming soon...</p>
            </div>
        </div>
    );
}

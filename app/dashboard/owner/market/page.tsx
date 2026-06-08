import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { checkMarketInsightsUnlock } from '@/app/lib/actions/credits';

import UnlockFeatureBanner from '@/app/components/dashboard/UnlockFeatureBanner';
import MarketInsightsClient from '@/app/components/market/MarketInsightsClient';

export default async function MarketInsightsPage() {
    const hasSystemFeature = await hasFeature(SYSTEM_FEATURES.MARKET_INSIGHTS);
    const { unlocked } = await checkMarketInsightsUnlock();
    const hasAccess = hasSystemFeature || unlocked;

    if (!hasAccess) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-white">ACP Market Insights</h1>
                <p className="text-slate-400 mt-2">Exclusive market trends and data.</p>
                <UnlockFeatureBanner
                    title="Access Real-Time Market Insights"
                    description="Stay ahead of the curve with detailed market trends, price fluctuations, and demand analysis for your area."
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">ACP Market Insights</h1>
                <p className="text-slate-500 mt-2">Explore actual transaction prices and market trends in your area.</p>
            </div>

            <MarketInsightsClient basePath="/dashboard/owner/market" />
        </div>
    );
}

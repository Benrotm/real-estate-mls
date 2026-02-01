import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';


import UpgradeBanner from '@/app/components/dashboard/UpgradeBanner';

export default async function MarketInsightsPage() {
    const hasAccess = await hasFeature(SYSTEM_FEATURES.MARKET_INSIGHTS);

    if (!hasAccess) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-slate-900">Market Insights</h1>
                <p className="text-slate-500 mt-2">Exclusive market trends and data.</p>
                <UpgradeBanner
                    title="Access Real-Time Market Insights"
                    description="Stay ahead of the curve with detailed market trends, price fluctuations, and demand analysis for your area."
                    buttonText="Upgrade to Pro"
                    buttonLink="/dashboard/owner/billing"
                />
            </div>
        );
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

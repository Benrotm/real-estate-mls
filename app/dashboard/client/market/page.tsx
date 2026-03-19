import MarketInsightsClient from '@/app/components/market/MarketInsightsClient';

export default function ClientMarketPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">ACP Market Insights</h1>
            <p className="text-slate-500 mb-8">Stay updated with the latest real estate trends.</p>

            <MarketInsightsClient basePath="/dashboard/client/market" />
        </div>
    );
}

import MarketInsightsClient from '@/app/components/market/MarketInsightsClient';

export default async function AdminMarketInsightsPage() {
    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">ACP Market Insights</h1>
                <p className="text-slate-500 mt-2">Global view of actual transaction prices and market trends across the platform.</p>
            </div>

            <MarketInsightsClient basePath="/dashboard/admin/market" />
        </div>
    );
}

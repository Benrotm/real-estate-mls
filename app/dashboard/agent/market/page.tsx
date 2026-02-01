import UpgradeBanner from '@/app/components/dashboard/UpgradeBanner';

export default function AgentMarketPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Market Insights</h1>
            <p className="text-slate-500 mb-8">Analyze local market trends and property values.</p>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-600 mb-6">Market data visualisation and reporting tools.</p>
                <button className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                    View Market Data
                </button>
            </div>
        </div>
    );
}

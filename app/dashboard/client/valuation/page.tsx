import UpgradeBanner from '@/app/components/dashboard/UpgradeBanner';

export default function ClientValuationPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Valuation Reports</h1>
            <p className="text-slate-500 mb-8">Get precise value estimates for properties you're interested in.</p>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
                <p className="text-slate-600 mb-6">Request a professional valuation for any property.</p>
                <button className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-colors">
                    Request Valuation
                </button>
            </div>
        </div>
    );
}

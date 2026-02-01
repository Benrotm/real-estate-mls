import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';

import ValuationClient from './ValuationClient';

import UpgradeBanner from '@/app/components/dashboard/UpgradeBanner';

export default async function ValuationPage() {
    const hasAccess = await hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS);

    if (!hasAccess) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Valuation Reports</h1>
                <p className="text-slate-500 mb-8">Get precise value estimates for your properties.</p>
                <UpgradeBanner
                    title="Unlock Professional Valuation Reports"
                    description="Get detailed property valuation reports powered by AI and local market data. Make informed decisions with accurate price estimates."
                    buttonText="Upgrade to Pro"
                    buttonLink="/dashboard/owner/billing"
                />
            </div>
        );
    }

    return <ValuationClient />;
}

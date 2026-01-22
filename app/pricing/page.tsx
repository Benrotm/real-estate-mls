import { fetchAllFeatures, fetchAllPlans } from '@/app/lib/admin';
import { Suspense } from 'react';
import PricingClient from './PricingClient';

export default async function PricingPage() {
    const allFeatures = await fetchAllFeatures();
    const allPlans = await fetchAllPlans() || [];

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Dynamic Plans...</div>}>
            <PricingClient allFeatures={allFeatures || []} allPlans={allPlans} />
        </Suspense>
    );
}

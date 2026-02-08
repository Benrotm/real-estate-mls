import { fetchAllFeatures, fetchAllPlans } from '@/app/lib/admin';
import { Suspense } from 'react';
import PricingClient from './PricingClient';
import { getUserProfile } from '@/app/lib/auth';

export default async function PricingPage() {
    const allFeatures = await fetchAllFeatures();
    const allPlans = await fetchAllPlans() || [];
    const user = await getUserProfile();

    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Dynamic Plans...</div>}>
            <PricingClient allFeatures={allFeatures || []} allPlans={allPlans} user={user} />
        </Suspense>
    );
}

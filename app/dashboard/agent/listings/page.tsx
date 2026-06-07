import { Suspense } from 'react';
import { getUserPropertiesWithOffers } from '@/app/lib/actions/offers';
import ListingsCRMClient from '@/app/components/dashboard/ListingsCRMClient';
import PropertySearchFilters from '@/app/components/PropertySearchFilters';
import { getUserProfile, getActiveUsageStats, getFeaturedStats } from '@/app/lib/auth';
import { getFeatureCosts } from '@/app/lib/actions/settings';
import YourPlanCard from '@/app/components/dashboard/YourPlanCard';

export const dynamic = 'force-dynamic';

export default async function AgentListingsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const filters = searchParams || {};
    const properties = await getUserPropertiesWithOffers(filters);
    const profile = await getUserProfile();
    const usageCount = profile ? await getActiveUsageStats(profile.id) : 0;
    const featuredCount = profile ? await getFeaturedStats(profile.id) : 0;
    const costsRes = await getFeatureCosts();
    const addListingCost = costsRes.costs?.['add_listing'] ?? 5;
    const featuredListingCost = costsRes.costs?.['featured_listing'] ?? 10;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Suspense fallback={<div className="h-20 bg-slate-50 animate-pulse rounded-xl" />}>
                    <PropertySearchFilters basePath="/dashboard/agent/listings" />
                </Suspense>

                <Suspense fallback={<div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />}>
                    <ListingsCRMClient properties={properties} />
                </Suspense>
            </div>
            <div className="space-y-6 lg:mt-14">
                <YourPlanCard
                    initialProfile={profile}
                    usageCount={usageCount}
                    featuredCount={featuredCount}
                    addListingCost={addListingCost}
                    featuredListingCost={featuredListingCost}
                />
            </div>
        </div>
    );
}

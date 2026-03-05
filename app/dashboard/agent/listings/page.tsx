import { Suspense } from 'react';
import { getUserPropertiesWithOffers } from '@/app/lib/actions/offers';
import ListingsCRMClient from '@/app/components/dashboard/ListingsCRMClient';
import PropertySearchFilters from '@/app/components/PropertySearchFilters';

export const dynamic = 'force-dynamic';

export default async function AgentListingsPage({
    searchParams
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const filters = searchParams || {};
    const properties = await getUserPropertiesWithOffers(filters);

    return (
        <div className="space-y-6">
            <Suspense fallback={<div className="h-20 bg-slate-50 animate-pulse rounded-xl" />}>
                <PropertySearchFilters basePath="/dashboard/agent/listings" />
            </Suspense>

            <Suspense fallback={<div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />}>
                <ListingsCRMClient properties={properties} />
            </Suspense>
        </div>
    );
}


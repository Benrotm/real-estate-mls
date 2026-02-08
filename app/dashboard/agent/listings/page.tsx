import { getUserPropertiesWithOffers } from '@/app/lib/actions/offers';
import ListingsCRMClient from '@/app/components/dashboard/ListingsCRMClient';

export default async function AgentListingsPage() {
    const properties = await getUserPropertiesWithOffers();

    return <ListingsCRMClient properties={properties} />;
}


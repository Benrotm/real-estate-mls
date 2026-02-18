import { getUserProperties } from '@/app/lib/actions/properties';
import ListingsCRMClient from '@/app/components/dashboard/ListingsCRMClient';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { PropertyWithOffers } from '@/app/lib/actions/offers';

export const metadata = {
    title: 'My Properties | Admin Dashboard',
};

export default async function MyPropertiesPage() {
    const propertiesRaw = await getUserProperties();

    // Manual mapping to avoid issues with getUserPropertiesWithOffers RLS/sub-queries
    const properties: PropertyWithOffers[] = propertiesRaw.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency || 'EUR',
        listing_type: p.listing_type,
        property_type: p.type,
        images: p.images || [],
        city: p.location_city,
        county: p.location_county,
        status: p.status,
        friendly_id: p.friendly_id,
        promoted: p.promoted,
        score: p.score,
        is_published: p.status === 'active',
        created_at: p.created_at,
        views_count: 0,
        favorites_count: 0,
        inquiries_count: 0,
        shares_count: 0,
        offers: [],
        inquiries: []
    }));

    const importButton = (
        <Link
            href="/dashboard/admin/properties/import"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
            <Download className="w-4 h-4" />
            Import Listing
        </Link>
    );

    return <ListingsCRMClient properties={properties} headerAction={importButton} />;
}

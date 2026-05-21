import { getClientOffers } from '@/app/lib/actions/offers';
import ClientOffersList from '@/app/components/dashboard/ClientOffersList';

export const metadata = {
    title: 'My Offers - Real Estate MLS',
    description: 'Track and manage your property offers and negotiations.',
};

export default async function ClientOffersPage() {
    const offers = await getClientOffers();

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Offers</h1>
                <p className="text-slate-500">
                    Track the status of your offers, review counter-offers, and manage active negotiations.
                </p>
            </div>

            <ClientOffersList offers={offers as any} />
        </div>
    );
}

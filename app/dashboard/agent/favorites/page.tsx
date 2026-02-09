
import { getUserFavorites } from '@/app/lib/actions/propertyAnalytics';
import FavoritesList from '@/app/components/dashboard/FavoritesList';

export default async function AgentFavoritesPage() {
    const favorites = await getUserFavorites();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-800">My Favorites</h1>
                <p className="text-slate-500">Properties you have saved for later.</p>
            </div>

            <FavoritesList favorites={favorites} />
        </div>
    );
}

import { getUserProfile, getUsageStats } from '../../lib/auth';
import AddPropertyForm from './AddPropertyForm';
import { ShieldAlert, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';

export default async function AddPropertyPage() {
    const profile = await getUserProfile();
    const currentUsage = profile ? await getUsageStats(profile.id) : 0;
    // Total limit = base plan limit + bonus listings granted by admin
    const baseLimit = profile?.listings_limit || 1;
    const bonusListings = profile?.bonus_listings || 0;
    const limit = baseLimit + bonusListings;

    const hasReachedLimit = currentUsage >= limit;

    if (hasReachedLimit) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold mb-3 text-white">Limit Reached</h1>
                    <p className="text-slate-400 mb-2 leading-relaxed">
                        You have reached the limit of <strong>{limit}</strong> active listings for your current plan.
                    </p>
                    <p className="text-slate-500 text-sm mb-8">
                        Upgrade to Enterprise to list unlimited properties.
                    </p>

                    <div className="space-y-4">
                        <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-900/20 border border-orange-500/20 flex items-center justify-center gap-2 group">
                            <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            Upgrade Plan
                        </button>

                        <Link
                            href="/dashboard"
                            className="block w-full py-4 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <AddPropertyForm />;
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2, Coins } from 'lucide-react';
import Link from 'next/link';
import { unlockMarketInsights } from '@/app/lib/actions/credits';
import { getFeatureCosts } from '@/app/lib/actions/settings';

interface UnlockFeatureBannerProps {
    title?: string;
    description?: string;
}

export default function UnlockFeatureBanner({
    title = "Access Real-Time Market Insights",
    description = "Stay ahead of the curve with detailed market trends, price fluctuations, and demand analysis for your area."
}: UnlockFeatureBannerProps) {
    const router = useRouter();
    const [cost, setCost] = useState<number>(20);
    const [loadingCost, setLoadingCost] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        getFeatureCosts().then(res => {
            if (res && res.costs && res.costs['unlock_market_insights'] !== undefined) {
                setCost(res.costs['unlock_market_insights']);
            }
            setLoadingCost(false);
        }).catch(err => {
            console.error('Error fetching cost:', err);
            setLoadingCost(false);
        });
    }, []);

    const handleUnlock = () => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
            const res = await unlockMarketInsights();
            if (res.success) {
                setSuccess('Feature unlocked successfully! Reloading...');
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            } else {
                setError(res.error || 'Failed to unlock feature.');
            }
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-8">
            <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 md:p-12 text-center border border-slate-800 shadow-2xl">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                        <Lock className="w-8 h-8 text-orange-500" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        {title}
                    </h2>

                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        {description}
                    </p>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6 flex items-start justify-center gap-2">
                            <span>{error}</span>
                            {error.includes('insuficiente') && (
                                <Link href="/cont/plati" className="underline font-bold text-white hover:text-cyan-300 ml-1">
                                    Alimentează
                                </Link>
                            )}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold px-4 py-3 rounded-xl mb-6">
                            {success}
                        </div>
                    )}

                    <button
                        onClick={handleUnlock}
                        disabled={isPending || loadingCost}
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-orange-600 rounded-lg overflow-hidden transition-all hover:bg-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.3)] disabled:opacity-50 cursor-pointer"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin animate-infinite" />
                            ) : (
                                <Coins className="w-4 h-4 text-yellow-300 animate-pulse" />
                            )}
                            {loadingCost ? 'Loading Cost...' : `Unlock Feature (${cost} CR)`}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>

                    <p className="mt-6 text-sm text-slate-500">
                        Deblocarea este permanentă pentru acest cont.
                    </p>
                </div>
            </div>
        </div>
    );
}

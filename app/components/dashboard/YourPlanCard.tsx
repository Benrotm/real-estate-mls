'use client';

import { useState } from 'react';
import { Plus, Coins, Gift, Building, Target, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buyListingSlot, buyFeaturedSlot } from '@/app/lib/actions/credits';

interface YourPlanCardProps {
    initialProfile: any;
    usageCount: number;
    featuredCount: number;
    addListingCost: number;
    featuredListingCost: number;
}

export default function YourPlanCard({
    initialProfile,
    usageCount,
    featuredCount,
    addListingCost,
    featuredListingCost
}: YourPlanCardProps) {
    const router = useRouter();
    const [profile, setProfile] = useState(initialProfile);
    const [isPurchasingListing, setIsPurchasingListing] = useState(false);
    const [isPurchasingFeatured, setIsPurchasingFeatured] = useState(false);

    if (!profile) return null;

    const baseLimit = profile.listings_limit || 1;
    const bonus = profile.bonus_listings || 0;
    const totalLimit = baseLimit + bonus;
    const featuredLimit = profile.featured_limit || 0;

    const usagePercent = Math.min(100, Math.round((usageCount / totalLimit) * 100));
    const featuredPercent = featuredLimit > 0 ? Math.min(100, Math.round((featuredCount / featuredLimit) * 100)) : 0;

    const availableListings = Math.max(0, totalLimit - usageCount);
    const availableFeatured = Math.max(0, featuredLimit - featuredCount);

    const handleBuyListing = async () => {
        if (profile.credits < addListingCost) {
            alert('Fonduri insuficiente. Vă rugăm să alimentați contul.');
            return;
        }

        setIsPurchasingListing(true);
        try {
            const res = await buyListingSlot();
            if (res.success) {
                setProfile((prev: any) => ({
                    ...prev,
                    bonus_listings: res.newBonus,
                    credits: res.remaining
                }));
                router.refresh();
                alert('Slot anunț cumpărat cu succes!');
            } else {
                alert(res.error || 'A apărut o eroare la cumpărarea slotului.');
            }
        } catch (err) {
            console.error('Error buying listing slot:', err);
            alert('Eroare tehnică la cumpărarea slotului.');
        } finally {
            setIsPurchasingListing(false);
        }
    };

    const handleBuyFeatured = async () => {
        if (profile.credits < featuredListingCost) {
            alert('Fonduri insuficiente. Vă rugăm să alimentați contul.');
            return;
        }

        setIsPurchasingFeatured(true);
        try {
            const res = await buyFeaturedSlot();
            if (res.success) {
                setProfile((prev: any) => ({
                    ...prev,
                    featured_limit: res.newLimit,
                    credits: res.remaining
                }));
                router.refresh();
                alert('Slot promovat cumpărat cu succes!');
            } else {
                alert(res.error || 'A apărut o eroare la cumpărarea slotului.');
            }
        } catch (err) {
            console.error('Error buying featured slot:', err);
            alert('Eroare tehnică la cumpărarea slotului.');
        } finally {
            setIsPurchasingFeatured(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8 text-slate-800">
            {/* Plan & Balance */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                        <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                            {profile.plan_tier || 'Free'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono">{profile.credits || 0} CR</span>
                        <Link 
                            href="/cont/plati" 
                            className="text-[9.5px] bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded-md transition-colors font-bold uppercase ml-1.5"
                        >
                            Alimentează
                        </Link>
                    </div>
                </div>
            </div>

            {/* Listings Usage */}
            <div className="flex-1 min-w-[180px] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">Anunțuri: <span className="font-mono text-slate-900 font-extrabold">{usageCount}/{totalLimit}</span></span>
                    <button
                        onClick={handleBuyListing}
                        disabled={isPurchasingListing || profile.credits < addListingCost}
                        className="text-[9.5px] bg-white border border-slate-205 hover:border-slate-300 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors font-bold disabled:opacity-50 cursor-pointer"
                    >
                        {isPurchasingListing ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5 text-slate-500" />}
                        Slot (+1: {addListingCost} CR)
                    </button>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${usagePercent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${usagePercent}%` }}
                    ></div>
                </div>
            </div>

            {/* Featured Usage */}
            <div className="flex-1 min-w-[180px] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">Promovate: <span className="font-mono text-slate-900 font-extrabold">{featuredCount}/{featuredLimit}</span></span>
                    <button
                        onClick={handleBuyFeatured}
                        disabled={isPurchasingFeatured || profile.credits < featuredListingCost}
                        className="text-[9.5px] bg-white border border-slate-205 hover:border-slate-300 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors font-bold disabled:opacity-50 cursor-pointer"
                    >
                        {isPurchasingFeatured ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5 text-slate-500" />}
                        Slot (+1: {featuredListingCost} CR)
                    </button>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${featuredPercent >= 100 ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${featuredPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

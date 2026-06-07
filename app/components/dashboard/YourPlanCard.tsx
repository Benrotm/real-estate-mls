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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Your Plan</h3>
                <span className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wide">
                    {profile.plan_tier || 'Free'}
                </span>
            </div>

            {/* Listings Progress & Purchase */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Listings Used</span>
                    <span>{usageCount} / {totalLimit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${usagePercent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                        style={{ width: `${usagePercent}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{availableListings} available</span>
                    {bonus > 0 && <span className="text-emerald-600 font-bold">+{bonus} Bonus included</span>}
                </div>

                <button
                    onClick={handleBuyListing}
                    disabled={isPurchasingListing || profile.credits < addListingCost}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    {isPurchasingListing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    Adaugă slot (+1 slot: {addListingCost} CR)
                </button>
            </div>

            {/* Featured Progress & Purchase */}
            <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Featured Slots</span>
                    <span>{featuredCount} / {featuredLimit}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${featuredPercent >= 100 ? 'bg-red-500' : 'bg-purple-500'}`}
                        style={{ width: `${featuredPercent}%` }}
                    ></div>
                </div>
                <p className="text-[11px] text-slate-400 text-right">{availableFeatured} available</p>

                <button
                    onClick={handleBuyFeatured}
                    disabled={isPurchasingFeatured || profile.credits < featuredListingCost}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    {isPurchasingFeatured ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    Adaugă slot promovat (+1 slot: {featuredListingCost} CR)
                </button>
            </div>

            {/* Credits Section */}
            <div className="mt-4 pt-6 border-t border-slate-150 space-y-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-yellow-500" /> Balance
                    </span>
                    <span className="font-mono font-black text-indigo-600">{profile.credits || 0} CR</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <Link href="/cont/plati" className="bg-slate-900 text-white font-bold py-2.5 px-2 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                        <Coins className="w-3.5 h-3.5" /> Alimentează
                    </Link>
                    <Link href="/cont/profil" className="border border-slate-200 text-slate-700 font-bold py-2.5 px-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-orange-500" /> Free Credits
                    </Link>
                </div>
                
                <Link href="/cont/profil" className="block text-center text-xs text-indigo-600 hover:text-indigo-800 font-bold tracking-wide transition-colors">
                    Invite a Friend
                </Link>
            </div>
        </div>
    );
}

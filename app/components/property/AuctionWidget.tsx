'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Clock, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Info, Lock } from 'lucide-react';
import { PropertyAuction, placeBid } from '@/app/lib/actions/auctions';

interface AuctionWidgetProps {
    auction: PropertyAuction;
    propertyId: string;
    currentUser: any;
    currency: string;
}

export default function AuctionWidget({
    auction,
    propertyId,
    currentUser,
    currency
}: AuctionWidgetProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [bidAmount, setBidAmount] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState<boolean>(false);

    // Calculate current highest bid
    const bids = auction.bids || [];
    const currentHighestBid = bids.length > 0 ? bids[0].bid_amount : 0;
    const minRequiredBid = currentHighestBid > 0 
        ? currentHighestBid + auction.min_increment 
        : auction.starting_price;

    // Set default value for custom bid input
    useEffect(() => {
        setBidAmount(String(minRequiredBid));
    }, [minRequiredBid]);

    // Timer & Status state
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
    const [auctionStatus, setAuctionStatus] = useState<'scheduled' | 'active' | 'ended'>(
        auction.status === 'cancelled' ? 'ended' : (auction.status as any)
    );

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const start = new Date(auction.start_time).getTime();
            const end = new Date(auction.end_time).getTime();

            if (now < start) {
                setAuctionStatus('scheduled');
                const diff = start - now;
                return {
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                    totalMs: diff
                };
            } else if (now >= start && now < end) {
                setAuctionStatus('active');
                const diff = end - now;
                return {
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60),
                    totalMs: diff
                };
            } else {
                setAuctionStatus('ended');
                return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
            }
        };

        // Run immediately
        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const calculated = calculateTimeLeft();
            setTimeLeft(calculated);
            if (calculated.totalMs <= 0 && auctionStatus !== 'ended') {
                clearInterval(timer);
                router.refresh();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [auction, auctionStatus, router]);

    // Format price helper
    const formatPrice = (amount: number) => {
        try {
            return new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: currency || 'EUR',
                maximumFractionDigits: 0
            }).format(amount);
        } catch (e) {
            return `${amount} ${currency}`;
        }
    };

    // Format relative time helper
    const formatRelativeTime = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffSeconds < 60) return 'just now';
        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    // Obfuscate user names for privacy
    const obfuscateName = (fullName: string | undefined, bidderId: string, currentUserId: string | undefined) => {
        if (currentUserId && bidderId === currentUserId) return 'You';
        if (!fullName) return 'Anonymous Bidder';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].slice(0, 3) + '...';
        }
        return parts[0] + ' ' + (parts[parts.length - 1][0] || '') + '.';
    };

    const handleQuickBid = (increment: number) => {
        setBidAmount(String(minRequiredBid + increment));
    };

    const handleSubmitBid = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        const amount = Number(bidAmount);
        if (isNaN(amount) || amount < minRequiredBid) {
            setFormError(`Your bid must be at least ${formatPrice(minRequiredBid)}`);
            return;
        }

        startTransition(async () => {
            const res = await placeBid(auction.id, amount);
            if (res.success) {
                setFormSuccess('Bid placed successfully!');
                setBidAmount(String(amount + auction.min_increment));
                router.refresh();
            } else {
                setFormError(res.error || 'Failed to place bid.');
            }
        });
    };

    const isOwner = currentUser?.id === auction.owner_id;

    // Quick increment steps based on min increment
    const quickIncrements = [0, auction.min_increment, auction.min_increment * 5, auction.min_increment * 10];

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl transition-all duration-300">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
            
            {/* Dynamic Glassmorphic Inner Container */}
            <div className="p-6">
                
                {/* Header: Action Status Badge & Timer Label */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {auctionStatus === 'active' && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            auctionStatus === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : auctionStatus === 'scheduled'
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}>
                            {auctionStatus === 'active' 
                                ? 'Live Auction' 
                                : auctionStatus === 'scheduled'
                                ? 'Upcoming Auction'
                                : 'Auction Ended'
                            }
                        </span>
                    </div>

                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {auctionStatus === 'active' 
                            ? 'Time Left' 
                            : auctionStatus === 'scheduled'
                            ? 'Starts In'
                            : 'Status'
                        }
                    </div>
                </div>

                {/* Countdown Timer Visuals */}
                {auctionStatus !== 'ended' && (
                    <div className="grid grid-cols-4 gap-2 text-center mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800">
                            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {timeLeft.days}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Days</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800">
                            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {String(timeLeft.hours).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Hours</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800">
                            <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                {String(timeLeft.minutes).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Mins</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-800 animate-pulse">
                            <span className="block text-2xl font-black text-orange-500 tabular-nums">
                                {String(timeLeft.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Secs</span>
                        </div>
                    </div>
                )}

                {/* Bidding Summary Panel */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-inner mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                                {currentHighestBid > 0 ? 'Current Highest Bid' : 'Starting Price'}
                            </span>
                            <span className="text-3xl font-black tracking-tight text-white block">
                                {formatPrice(currentHighestBid > 0 ? currentHighestBid : auction.starting_price)}
                            </span>
                        </div>
                        <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-orange-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Reserve price status if configured */}
                    {auction.reserve_price !== null && auction.reserve_price > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                            {currentHighestBid >= auction.reserve_price ? (
                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Reserve price met (Property will sell)</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold">
                                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                                    <span>Reserve price not met</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Interactive Action Module */}
                <div className="space-y-4">
                    {auctionStatus === 'ended' ? (
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                            <Gavel className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <h4 className="text-slate-900 dark:text-white font-bold text-sm">Bidding Closed</h4>
                            <p className="text-slate-400 text-xs mt-1">This auction has completed. No further offers are accepted.</p>
                        </div>
                    ) : auctionStatus === 'scheduled' ? (
                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 text-center">
                            <Lock className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                            <h4 className="text-indigo-900 dark:text-indigo-400 font-bold text-sm">Bidding Locked</h4>
                            <p className="text-slate-500 text-xs mt-1">
                                Bidding starts on {new Date(auction.start_time).toLocaleString()}
                            </p>
                        </div>
                    ) : isOwner ? (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
                            <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <h4 className="text-amber-900 dark:text-amber-400 font-bold text-sm">Listing Owner</h4>
                            <p className="text-slate-500 text-xs mt-1">You cannot bid on your own property auction. Monitor bids below.</p>
                        </div>
                    ) : !currentUser ? (
                        <a
                            href="/auth/login"
                            className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-center block shadow-lg shadow-orange-500/20 transition duration-200"
                        >
                            Log in to Place a Bid
                        </a>
                    ) : (
                        <form onSubmit={handleSubmitBid} className="space-y-4">
                            {formError && (
                                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            {formSuccess && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{formSuccess}</span>
                                </div>
                            )}

                            {/* Standard Bid input field */}
                            <div>
                                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                                    Your Bid Amount ({currency})
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                                        {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min={minRequiredBid}
                                        step="1"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        disabled={isPending}
                                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-50"
                                        placeholder={String(minRequiredBid)}
                                    />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                                    Minimum next bid: <strong className="text-slate-700 dark:text-slate-300">{formatPrice(minRequiredBid)}</strong>
                                </span>
                            </div>

                            {/* Quick Bid incremental selectors */}
                            <div className="grid grid-cols-4 gap-2">
                                {quickIncrements.map((inc, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleQuickBid(inc)}
                                        className={`py-2 px-1 text-[11px] font-bold border rounded-xl transition duration-150 ${
                                            (Number(bidAmount) === minRequiredBid + inc)
                                                ? 'bg-orange-500 text-white border-orange-500'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {inc === 0 ? 'Min' : `+${inc}`}
                                    </button>
                                ))}
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide shadow-lg shadow-orange-500/20 active:scale-98 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Placing Bid...
                                    </>
                                ) : (
                                    <>
                                        <Gavel className="w-5 h-5" />
                                        Place Bid
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Separator */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-6" />

                {/* Collapsible Recent Bids Log */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className="w-full flex items-center justify-between py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-150 group"
                    >
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Gavel className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            <span>Bidding History</span>
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {bids.length}
                            </span>
                        </div>
                        {showHistory ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </button>

                    {showHistory && (
                        <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {bids.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-xs">
                                    No bids placed yet. Be the first to bid!
                                </div>
                            ) : (
                                bids.map((bid, index) => (
                                    <div 
                                        key={bid.id} 
                                        className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition duration-150 ${
                                            index === 0 
                                                ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.02] border-emerald-500/20' 
                                                : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-900/60'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                                                index === 0 
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                                {index === 0 ? '🏆' : index + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {obfuscateName(bid.user_name, bid.user_id, currentUser?.id)}
                                                </div>
                                                <div className="text-[10px] text-slate-400 mt-0.5">
                                                    {formatRelativeTime(bid.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="font-extrabold text-slate-900 dark:text-white">
                                            {formatPrice(bid.bid_amount)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Clock, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Info, Lock, Trophy, Coins } from 'lucide-react';
import { PropertyAuction, placeBid, createAuction, closeAuction, chooseOffersWinner } from '@/app/lib/actions/auctions';

interface AuctionWidgetProps {
    auction: PropertyAuction | null;
    propertyId: string;
    currentUser: any;
    currency: string;
    ownerId?: string;
    propertyPrice?: number;
}

export default function AuctionWidget({
    auction,
    propertyId,
    currentUser,
    currency,
    ownerId,
    propertyPrice
}: AuctionWidgetProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // Bid / Offer form states
    const [bidAmount, setBidAmount] = useState<string>('');
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showInfoPopup, setShowInfoPopup] = useState<boolean>(false);
    const [costs, setCosts] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchCosts = async () => {
            const { getFeatureCosts } = await import('@/app/lib/actions/settings');
            const res = await getFeatureCosts();
            if (res.costs) {
                setCosts(res.costs);
            }
        };
        fetchCosts();
    }, []);

    // Owner start form states
    const [startStartingPrice, setStartStartingPrice] = useState<string>(
        auction ? String(auction.starting_price) : (propertyPrice ? String(propertyPrice) : '')
    );
    const [startMinIncrement, setStartMinIncrement] = useState<string>(
        auction ? String(auction.min_increment) : '500'
    );
    const [startDurationDays, setStartDurationDays] = useState<string>('7');
    const [confirmClose, setConfirmClose] = useState<boolean>(false);

    // Calculate current highest offer dynamically since bids are sorted chronologically
    const bids = auction ? (auction.bids || []) : [];
    const currentHighestOffer = bids.length > 0 ? Math.max(...bids.map(b => b.bid_amount)) : 0;
    const recommendedOffer = currentHighestOffer > 0 
        ? currentHighestOffer + (auction?.min_increment || 500) 
        : (auction?.starting_price || propertyPrice || 0);

    // Set default value for custom bid input
    useEffect(() => {
        setBidAmount(String(recommendedOffer));
    }, [recommendedOffer]);

    // Timer & Status state
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
    const [auctionStatus, setAuctionStatus] = useState<'scheduled' | 'active' | 'ended'>(
        !auction || auction.status === 'cancelled' ? 'ended' : (auction.status as any)
    );

    useEffect(() => {
        if (!auction) {
            setAuctionStatus('ended');
            return;
        }

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
        if (!fullName) return 'Anonymous Offerer';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].slice(0, 3) + '...';
        }
        return parts[0] + ' ' + (parts[parts.length - 1][0] || '') + '.';
    };

    const handleQuickBid = (increment: number) => {
        setBidAmount(String(recommendedOffer + increment));
    };

    const handleSubmitBid = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auction) return;
        setFormError(null);
        setFormSuccess(null);

        const amount = Number(bidAmount);
        if (isNaN(amount) || amount <= 0) {
            setFormError(`Your offer must be a positive amount.`);
            return;
        }

        startTransition(async () => {
            const res = await placeBid(auction.id, amount);
            if (res.success) {
                setFormSuccess('Offer sent successfully!');
                router.refresh();
            } else {
                setFormError(res.error || 'Failed to send offer.');
            }
        });
    };

    const handleStartAuction = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFormSuccess(null);

        const price = Number(startStartingPrice);
        const increment = Number(startMinIncrement);
        const duration = Number(startDurationDays);

        if (isNaN(price) || price <= 0) {
            setFormError('Starting price must be a positive number.');
            return;
        }
        if (isNaN(increment) || increment < 0) {
            setFormError('Recommended increment must be a non-negative number.');
            return;
        }

        startTransition(async () => {
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
            const res = await createAuction(
                propertyId,
                price,
                null,
                increment,
                now.toISOString(),
                endTime.toISOString()
            );
            if (res.success) {
                setFormSuccess('Live Open Offers session started successfully!');
                router.refresh();
            } else {
                setFormError(res.error || 'Failed to start Live Open Offers.');
            }
        });
    };

    const handleCloseAuction = async () => {
        if (!auction) return;
        if (!confirmClose) {
            setConfirmClose(true);
            setTimeout(() => setConfirmClose(false), 3000);
            return;
        }

        setConfirmClose(false);
        setFormError(null);
        setFormSuccess(null);

        startTransition(async () => {
            const res = await closeAuction(auction.id);
            if (res.success) {
                setFormSuccess('Live Open Offers session closed successfully!');
                router.refresh();
            } else {
                setFormError(res.error || 'Failed to close open offers session.');
            }
        });
    };

    const handleSelectWinner = async (bidId: string, amount: number, bidderName: string | undefined) => {
        if (!auction) return;
        if (!confirm(`Sunteți sigur că doriți să alegeți oferta de ${amount} EUR a lui ${bidderName || 'anonim'} ca fiind câștigătoare? Această acțiune va închide sesiunea și creditele nu vor fi returnate.`)) {
            return;
        }

        setFormError(null);
        setFormSuccess(null);

        startTransition(async () => {
            const res = await chooseOffersWinner(auction.id, bidId);
            if (res.success) {
                setFormSuccess('Câștigătorul a fost selectat și notificat cu succes!');
                router.refresh();
            } else {
                setFormError(res.error || 'Eroare la selectarea câștigătorului.');
            }
        });
    };

    const isOwner = currentUser?.id && ownerId ? currentUser.id === ownerId : (currentUser?.id && auction ? currentUser.id === auction.owner_id : false);

    // Quick increment steps based on recommended increment
    const quickIncrements = [
        0, 
        auction?.min_increment || 500, 
        (auction?.min_increment || 500) * 5, 
        (auction?.min_increment || 500) * 10
    ];

    const renderStartForm = () => (
        <form onSubmit={handleStartAuction} className="space-y-4">
            <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                    Starting Offer Price ({currency})
                </label>
                <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={startStartingPrice}
                    onChange={(e) => setStartStartingPrice(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-50"
                    placeholder="e.g. 150000"
                />
            </div>

            <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                    Recommended increment ({currency})
                </label>
                <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={startMinIncrement}
                    onChange={(e) => setStartMinIncrement(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white font-bold text-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-50"
                    placeholder="e.g. 500"
                />
            </div>

            <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                    Duration (Days)
                </label>
                <select
                    value={startDurationDays}
                    onChange={(e) => setStartDurationDays(e.target.value)}
                    disabled={isPending}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white font-bold text-md focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-50"
                >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="5">5 Days</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide shadow-lg shadow-orange-500/20 active:scale-98 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting Live Open Offers...
                    </>
                ) : (
                    <>
                        <Gavel className="w-5 h-5" />
                        Start Live Open Offers
                    </>
                )}
            </button>
        </form>
    );

    const renderBidForm = () => (
        <form onSubmit={handleSubmitBid} className="space-y-4">
            <div>
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1.5">
                    Your Offer Amount ({currency})
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                        {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency}
                    </span>
                    <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        disabled={isPending}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition disabled:opacity-50"
                        placeholder={String(recommendedOffer)}
                    />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Recommended next offer: <strong className="text-slate-700 dark:text-slate-300">{formatPrice(recommendedOffer)}</strong>
                </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {quickIncrements.map((inc, i) => (
                    <button
                        key={i}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleQuickBid(inc)}
                        className={`py-2 px-1 text-[11px] font-bold border rounded-xl transition duration-150 ${
                            (Number(bidAmount) === recommendedOffer + inc)
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {inc === 0 ? 'Rec' : `+${inc}`}
                    </button>
                ))}
            </div>

            {/* Credits note for bidders */}
            <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-850/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400">
                <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                    Trimiterea unei oferte costă <strong>{costs['open_offers_submit'] ?? 1} credite</strong>. Dacă proprietarul anulează sesiunea, creditele îți vor fi returnate automat.
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold tracking-wide shadow-lg shadow-orange-500/20 active:scale-98 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isPending ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Open Offer...
                    </>
                ) : (
                    <>
                        <Gavel className="w-5 h-5" />
                        Send Open Offer
                    </>
                )}
            </button>
        </form>
    );

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl transition-all duration-300">
            {/* Top decorative gradient glow */}
            <div className="absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
            
            {/* Dynamic Glassmorphic Inner Container */}
            <div className="p-6">
                
                {/* Header: Action Status Badge & Timer Label */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        {auctionStatus === 'active' && auction && (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            auctionStatus === 'active' && auction
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : auctionStatus === 'scheduled' && auction
                                ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                        }`}>
                            {!auction 
                                ? 'Open Offers Inactive'
                                : auctionStatus === 'active' 
                                ? 'Live Open Offers' 
                                : auctionStatus === 'scheduled'
                                ? 'Upcoming Open Offers'
                                : 'Open Offers Ended'
                            }
                        </span>

                        {auction && (
                            <button
                                type="button"
                                onClick={() => setShowInfoPopup(!showInfoPopup)}
                                className={`p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg cursor-pointer ${
                                    showInfoPopup ? 'bg-blue-500/10 text-blue-500' : ''
                                }`}
                                title="Reguli Sesiune Oferte & Credite"
                            >
                                <Info className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {auction && (
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {auctionStatus === 'active' 
                                ? 'Time Left' 
                                : auctionStatus === 'scheduled'
                                ? 'Starts In'
                                : 'Status'
                            }
                        </div>
                    )}
                </div>

                {showInfoPopup && (
                    <div className="mb-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-xs space-y-2 text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h4 className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <Coins className="w-4 h-4 text-blue-500" /> Regulament Sesiune Open Offers
                        </h4>
                        <p className="leading-relaxed">
                            Pentru a asigura corectitudinea ofertelor și a proteja participanții, platforma folosește credite astfel:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 mt-1">
                            <li><strong>Deschidere Sesiune:</strong> Costă proprietarul <strong>{costs['open_offers_start'] ?? 5}</strong> credite.</li>
                            <li><strong>Trimitere Ofertă:</strong> Costă ofertantul <strong>{costs['open_offers_submit'] ?? 1} credite</strong> pentru a evita ofertele false fara interes real.</li>
                            <li><strong>Anulare de către Proprietar:</strong> Proprietarul este penalizat cu <strong>{costs['open_offers_cancel'] ?? 10}</strong> credite, iar ofertanții își primesc creditele înapoi.</li>
                            <li><strong>Selectare Câștigător:</strong> Proprietarul alege o ofertă câștigătoare. Creditele nu se returnează, iar proprietarul nu plătește taxa de anulare.</li>
                        </ul>
                    </div>
                )}

                {/* Countdown Timer Visuals */}
                {auction && auctionStatus !== 'ended' && (
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
                {auction && (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-slate-800 shadow-inner mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                                    {currentHighestOffer > 0 ? 'Current Highest Offer' : 'Starting Price'}
                                </span>
                                <span className="text-3xl font-black tracking-tight text-white block">
                                    {formatPrice(currentHighestOffer > 0 ? currentHighestOffer : auction.starting_price)}
                                </span>
                            </div>
                            <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-orange-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>

                        {/* Winner status if selected */}
                        {auction.winner_bid_id ? (
                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-yellow-400 text-xs font-bold">
                                <Trophy className="w-4 h-4 text-yellow-500 animate-bounce shrink-0" />
                                <span>Sesiune Finalizată! Oferta câștigătoare a fost selectată.</span>
                            </div>
                        ) : auction.reserve_price !== null && auction.reserve_price > 0 ? (
                            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                                {currentHighestOffer >= auction.reserve_price ? (
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
                        ) : null}
                    </div>
                )}

                {/* Interactive Action Module */}
                <div className="space-y-4">
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

                    {!auction ? (
                        isOwner ? (
                            renderStartForm()
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                                <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h4 className="text-slate-900 dark:text-white font-bold text-sm">No Active Offers Session</h4>
                                <p className="text-slate-400 text-xs mt-1">There are no open offers for this property yet.</p>
                            </div>
                        )
                    ) : auctionStatus === 'ended' || auction.status === 'cancelled' ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                                <Gavel className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <h4 className="text-slate-900 dark:text-white font-bold text-sm">Offers Closed</h4>
                                <p className="text-slate-400 text-xs mt-1">This open offers session has completed. No further offers are accepted.</p>
                            </div>
                            {isOwner && (
                                <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                                    <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-3">Start a New Open Offers Session</h4>
                                    {renderStartForm()}
                                </div>
                            )}
                        </div>
                    ) : auctionStatus === 'scheduled' ? (
                        <div className="space-y-4">
                            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 text-center">
                                <Lock className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                                <h4 className="text-indigo-900 dark:text-indigo-400 font-bold text-sm">Offers Locked</h4>
                                <p className="text-slate-500 text-xs mt-1">
                                    Offers start on {new Date(auction.start_time).toLocaleString()}
                                </p>
                            </div>
                            {isOwner && (
                                <button
                                    type="button"
                                    onClick={handleCloseAuction}
                                    disabled={isPending}
                                    className={`w-full py-3 px-6 rounded-2xl font-bold tracking-wide shadow-lg transition duration-150 flex items-center justify-center gap-2 ${
                                        confirmClose 
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 animate-pulse'
                                            : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700'
                                    }`}
                                >
                                    {confirmClose ? 'Confirm cancel upcoming offers?' : 'Cancel upcoming offers'}
                                </button>
                            )}
                        </div>
                    ) : (
                        isOwner ? (
                            <div className="space-y-4">
                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
                                    <Info className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <h4 className="text-amber-900 dark:text-amber-400 font-bold text-sm">Listing Owner</h4>
                                    <p className="text-slate-500 text-xs mt-1">You cannot make offers on your own property. Monitor offers below.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseAuction}
                                    disabled={isPending}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold tracking-wide shadow-lg transition duration-150 flex items-center justify-center gap-2 ${
                                        confirmClose 
                                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 animate-pulse'
                                            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                                    }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    {confirmClose ? 'Confirm close open offers?' : 'Close Open Offers'}
                                </button>
                            </div>
                        ) : !currentUser ? (
                            <a
                                href="/auth/login"
                                className="w-full py-4 px-6 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-center block shadow-lg shadow-orange-500/20 transition duration-200"
                            >
                                Log in to Send Open Offer
                            </a>
                        ) : (
                            renderBidForm()
                        )
                    )}
                </div>

                {/* Separator */}
                {auction && <div className="border-t border-slate-100 dark:border-slate-800/80 my-6" />}

                {/* Collapsible Recent Offers Log */}
                {auction && (
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full flex items-center justify-between py-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition duration-150 group"
                        >
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <Gavel className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                <span>Offer Order History</span>
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
                                        No offers sent yet. Be the first to send an offer!
                                    </div>
                                ) : (
                                    bids.map((bid, index) => {
                                        const isWinner = auction.winner_bid_id === bid.id;
                                        const hasWinner = !!auction.winner_bid_id;
                                        return (
                                            <div 
                                                key={bid.id} 
                                                className={`flex items-center justify-between p-3 rounded-2xl border text-xs transition duration-155 ${
                                                    isWinner
                                                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-900 dark:text-yellow-400 font-bold'
                                                        : bid.bid_amount === currentHighestOffer
                                                        ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.02] border-emerald-500/20' 
                                                        : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-900/60'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold ${
                                                        isWinner
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                                            : bid.bid_amount === currentHighestOffer
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {isWinner ? <Trophy className="w-3.5 h-3.5" /> : bid.bid_amount === currentHighestOffer ? '🏆' : index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                                            {obfuscateName(bid.user_name, bid.user_id, currentUser?.id)}
                                                            {isWinner && <span className="text-[9px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Winner</span>}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                                            {formatRelativeTime(bid.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="font-extrabold text-slate-900 dark:text-white">
                                                        {formatPrice(bid.bid_amount)}
                                                    </div>
                                                    {isOwner && !hasWinner && (auction.status === 'active' || auction.status === 'ended') && (
                                                        <button
                                                            type="button"
                                                            disabled={isPending}
                                                            onClick={() => handleSelectWinner(bid.id, bid.bid_amount, bid.user_name)}
                                                            className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-black font-extrabold rounded-lg transition-colors cursor-pointer text-[10px] shadow"
                                                        >
                                                            Alege
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

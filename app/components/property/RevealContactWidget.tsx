'use client';

import { useState } from 'react';
import { Phone, User, Lock, Coins, Loader2, ArrowRight } from 'lucide-react';
import { unlockContact } from '@/app/lib/actions/credits';
import Link from 'next/link';

interface RevealContactWidgetProps {
    propertyId: string;
    propertyTitle: string;
    isLoggedIn: boolean;
    initialUnlocked: boolean;
    cost: number;
    userCredits: number;
    contactName: string;
    contactPhone: string;
}

export default function RevealContactWidget({
    propertyId,
    propertyTitle,
    isLoggedIn,
    initialUnlocked,
    cost,
    userCredits: initialUserCredits,
    contactName: propContactName,
    contactPhone: propContactPhone
}: RevealContactWidgetProps) {
    const [unlocked, setUnlocked] = useState(initialUnlocked);
    const [userCredits, setUserCredits] = useState(initialUserCredits);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contactName, setContactName] = useState(propContactName);
    const [contactPhone, setContactPhone] = useState(propContactPhone);

    const handleUnlock = async () => {
        if (!isLoggedIn) {
            window.location.href = `/auth/login?redirectTo=/properties/${propertyId}`;
            return;
        }

        setError(null);
        setIsUnlocking(true);
        try {
            const res = await unlockContact(propertyId, propertyTitle);
            if (res.success) {
                setUnlocked(true);
                if (res.remaining !== undefined) {
                    setUserCredits(res.remaining);
                }
                if (res.contactName) {
                    setContactName(res.contactName);
                }
                if (res.contactPhone) {
                    setContactPhone(res.contactPhone);
                }
            } else {
                setError(res.error || 'Failed to unlock contact info.');
            }
        } catch (err: any) {
            console.error('Error unlocking contact:', err);
            setError(err.message || 'An error occurred during unlock.');
        } finally {
            setIsUnlocking(false);
        }
    };

    if (unlocked) {
        return (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <User className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Nume Contact</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans">{contactName}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Phone className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-sans">Număr Telefon</div>
                        <a 
                            href={`tel:${contactPhone}`} 
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-orange-500 transition-colors font-mono"
                        >
                            {contactPhone}
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-4">
            <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium font-sans">
                    Detalii contact private. Deblocați numărul de telefon al {contactName === 'Owner' || contactName === 'Proprietar' ? 'proprietarului' : 'agentului'} folosind credite.
                </div>
            </div>

            {error && (
                <div className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/5 p-2 rounded-lg border border-rose-100 dark:border-rose-500/10 font-sans">
                    {error}
                </div>
            )}

            {!isLoggedIn ? (
                <Link
                    href={`/auth/login?redirectTo=/properties/${propertyId}`}
                    className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-normal uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all font-sans text-center"
                >
                    <Lock className="w-3.5 h-3.5" /> Conectează-te pentru a Debloca
                </Link>
            ) : (
                <div className="space-y-2">
                    {userCredits >= cost ? (
                        <button
                            onClick={handleUnlock}
                            disabled={isUnlocking}
                            className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-normal uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer font-sans"
                        >
                            {isUnlocking ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Coins className="w-3.5 h-3.5 text-yellow-300" />
                            )}
                            Deblochează cu {cost} CR
                        </button>
                    ) : (
                        <div className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/5 p-2 rounded-lg border border-rose-100 dark:border-rose-500/10 text-center font-sans">
                            Balanță insuficientă ({userCredits} CR). Sunt necesare {cost} CR.
                        </div>
                    )}
                    
                    <Link
                        href="/cont/plati"
                        className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-normal shadow-sm flex items-center justify-between gap-1.5 transition-all font-sans text-center border border-slate-200 dark:border-slate-700"
                    >
                        <span className="flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />
                            <span>Credits: <strong className="font-bold">{userCredits} CR</strong></span>
                        </span>
                        <span className="text-orange-500 dark:text-orange-400 hover:underline flex items-center gap-0.5">
                            Add more Credits <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}

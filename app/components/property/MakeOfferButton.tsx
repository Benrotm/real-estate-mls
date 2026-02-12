'use client';

import { useState } from 'react';
import { BadgeDollarSign, Lock } from 'lucide-react';
import OfferModal from '../OfferModal';
import UpgradeModal from '../UpgradeModal';

interface MakeOfferButtonProps {
    propertyId: string;
    propertyTitle: string;
    currency: string;
    showMakeOffer: boolean;
    isMakeOfferLocked?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'neon';
    className?: string;
    fullWidth?: boolean;
}

export default function MakeOfferButton({
    propertyId,
    propertyTitle,
    currency,
    showMakeOffer,
    isMakeOfferLocked = false,
    variant = 'primary',
    className = '',
    fullWidth = false
}: MakeOfferButtonProps) {
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    if (!showMakeOffer) return null;

    const baseStyles = "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
        secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
        outline: "bg-transparent border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
    };

    const widthClass = fullWidth ? "w-full" : "";

    const handleClick = () => {
        if (isMakeOfferLocked) {
            setIsUpgradeModalOpen(true);
        } else {
            setIsOfferModalOpen(true);
        }
    };

    // Neon Variant (Complex Structure)
    if (variant === 'neon') {
        return (
            <>
                <button
                    onClick={handleClick}
                    className={`relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 group ${className}`}
                >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0EA5E9_0%,#F472B6_25%,#8B5CF6_50%,#10B981_75%,#0EA5E9_100%)]" />
                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-6 py-1 text-sm font-bold text-slate-900 backdrop-blur-3xl transition-all group-hover:bg-white/90 gap-2 uppercase tracking-wide">
                        {isMakeOfferLocked ? (
                            <Lock className="w-4 h-4 transition-transform group-hover:scale-110 text-slate-400" />
                        ) : (
                            <BadgeDollarSign className="w-4 h-4 transition-transform group-hover:scale-110 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 fill-indigo-600" />
                        )}
                        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-violet-600 group-hover:to-indigo-600 transition-all">
                            Make an Offer
                        </span>
                    </span>
                </button>

                <OfferModal
                    isOpen={isOfferModalOpen}
                    onClose={() => setIsOfferModalOpen(false)}
                    propertyTitle={propertyTitle}
                    propertyId={propertyId}
                    currencySymbol={currency === 'USD' ? '$' : '€'}
                />

                <UpgradeModal
                    isOpen={isUpgradeModalOpen}
                    onClose={() => setIsUpgradeModalOpen(false)}
                    featureName="Make an Offer"
                    description="This property cannot receive offers because the owner's plan does not support this feature."
                />
            </>
        );
    }

    return (
        <>
            <button
                onClick={handleClick}
                className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`}
            >
                {isMakeOfferLocked ? (
                    <Lock className="w-4 h-4" />
                ) : (
                    <BadgeDollarSign className="w-4 h-4" />
                )}
                Make an Offer
            </button>

            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                propertyId={propertyId}
                propertyTitle={propertyTitle}
                currencySymbol={currency === 'USD' ? '$' : '€'}
            />

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="Make an Offer"
                description="This property cannot receive offers because the owner's plan does not support this feature."
            />
        </>
    );
}

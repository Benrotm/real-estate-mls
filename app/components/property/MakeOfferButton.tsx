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
    variant?: 'primary' | 'secondary' | 'outline';
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

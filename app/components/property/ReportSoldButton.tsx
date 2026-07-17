'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ReportSoldModal from '@/app/components/properties/ReportSoldModal';

export default function ReportSoldButton({
    propertyId,
    propertyTitle,
    listingPrice,
    currency,
    currentStatus
}: {
    propertyId: string;
    propertyTitle: string;
    listingPrice: number;
    currency: string;
    currentStatus: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    if (currentStatus === 'sold') {
        return (
            <div className="px-4 py-2.5 bg-emerald-950/40 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-900/50 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>PROPERTY SOLD</span>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition duration-300 flex items-center gap-2 cursor-pointer"
            >
                <CheckCircle2 className="w-4 h-4 text-emerald-450" />
                <span>REPORT SOLD</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold text-[9px] border border-emerald-500/30 normal-case ml-0.5 font-mono">
                    +10 CR
                </span>
            </button>

            {isOpen && (
                <ReportSoldModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    propertyId={propertyId}
                    propertyTitle={propertyTitle}
                    listingPrice={listingPrice}
                    currency={currency}
                />
            )}
        </>
    );
}

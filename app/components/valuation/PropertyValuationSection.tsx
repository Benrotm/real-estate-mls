'use client';

import { useState } from 'react';
import ValuationWidget from '@/app/components/ValuationWidget';
import SoldPriceModal from '@/app/components/valuation/SoldPriceModal';
import { BadgeDollarSign } from 'lucide-react';

export default function PropertyValuationSection({ property, showMakeOffer }: { property: any, showMakeOffer?: boolean }) {
    const [isSoldModalOpen, setIsSoldModalOpen] = useState(false);

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Market value & Insights</h2>

                <button
                    onClick={() => setIsSoldModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
                >
                    <BadgeDollarSign className="w-4 h-4" />
                    Contribute Sold Price
                </button>
            </div>

            <ValuationWidget property={property} showMakeOffer={showMakeOffer} />

            <SoldPriceModal
                propertyId={property.id}
                isOpen={isSoldModalOpen}
                onClose={() => setIsSoldModalOpen(false)}
            />
        </div>
    );
}

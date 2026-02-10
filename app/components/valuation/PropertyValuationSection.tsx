'use client';

import { useState } from 'react';
import ValuationWidget from '@/app/components/ValuationWidget';

import OfferModal from '../OfferModal';
import UpgradeModal from '@/app/components/UpgradeModal';
import { BadgeDollarSign, Lock } from 'lucide-react';

export default function PropertyValuationSection({ property, showMakeOffer, isMakeOfferLocked, showValuationWidget = true, darkMode = false }: { property: any, showMakeOffer?: boolean, isMakeOfferLocked?: boolean, showValuationWidget?: boolean, darkMode?: boolean }) {

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

    return (
        <div id="valuation-section" className="mt-12">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-slate-900'}`}>Market value & Insights</h2>

                <div className="flex items-center gap-3">
                    {showMakeOffer && (
                        isMakeOfferLocked ? (
                            <button
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg text-sm font-bold transition-all border border-slate-200 cursor-pointer"
                            >
                                <Lock className="w-4 h-4" />
                                Make an Offer
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsOfferModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 transform"
                            >
                                <BadgeDollarSign className="w-4 h-4" />
                                Make an Offer
                            </button>
                        )
                    )}


                </div>
            </div>

            {showValuationWidget && <ValuationWidget property={property} showMakeOffer={false} />}



            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="Make an Offer"
                description="This property cannot receive offers because the owner's plan does not support this feature."
            />

            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                propertyId={property.id}
                propertyTitle={property.title}
                currencySymbol={property.currency === 'USD' ? '$' : '€'}
            />
        </div>
    );
}

'use client';

import { useState } from 'react';
import { BadgeDollarSign, Video, MessageCircle, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import UpgradeModal from './UpgradeModal';
// OfferModal is in the same directory (app/components) based on list_dir
import OfferModal from './OfferModal';

interface PropertyFeaturesProps {
    propertyId: string;
    ownerId: string;
    features: {
        makeOffer: boolean;
        virtualTour: boolean;
        directMessage: boolean;
    };
    propertyTitle?: string;
    currency?: string;
}

export default function PropertyFeatures({ propertyId, ownerId, features, propertyTitle = '', currency = 'USD' }: PropertyFeaturesProps) {
    const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

    const handleFeatureClick = (feature: string, hasAccess: boolean, action?: () => void) => {
        if (!hasAccess) {
            setUpgradeFeature(feature);
        } else if (action) {
            action();
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-slate-900">Platform Features</h3>
                <p className="text-sm text-slate-500">Available interactions for this property</p>
            </div>

            <div className="divide-y divide-gray-100">
                {/* Make an Offer */}
                <div
                    onClick={() => handleFeatureClick('Make an Offer', features.makeOffer, () => setIsOfferModalOpen(true))}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${features.makeOffer ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {features.makeOffer ? <BadgeDollarSign className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className={`font-bold ${features.makeOffer ? 'text-slate-900' : 'text-slate-400'}`}>Make an Offer</h4>
                            <p className="text-xs text-slate-500">Submit a formal price offer directly to the owner</p>
                        </div>
                    </div>
                    <div>
                        {features.makeOffer ? (
                            <span className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" /> Available
                            </span>
                        ) : (
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                Unlock Feature
                            </span>
                        )}
                    </div>
                </div>

                {/* Virtual Tour */}
                <div
                    onClick={() => handleFeatureClick('Virtual Tour', features.virtualTour, () => {
                        document.getElementById('virtual-tour-section')?.scrollIntoView({ behavior: 'smooth' });
                    })}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${features.virtualTour ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                            {features.virtualTour ? <Video className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className={`font-bold ${features.virtualTour ? 'text-slate-900' : 'text-slate-400'}`}>Virtual Tour</h4>
                            <p className="text-xs text-slate-500"> immersive 3D walkthrough experience</p>
                        </div>
                    </div>
                    <div>
                        {features.virtualTour ? (
                            <span className="text-blue-600 text-sm font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" /> Available
                            </span>
                        ) : (
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                Unlock Feature
                            </span>
                        )}
                    </div>
                </div>

                {/* Direct Message - Placeholder/Future */}
                <div
                    onClick={() => handleFeatureClick('Direct Message', features.directMessage, () => { })}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${features.directMessage ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                            {features.directMessage ? <MessageCircle className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                            <h4 className={`font-bold ${features.directMessage ? 'text-slate-900' : 'text-slate-400'}`}>Direct Message</h4>
                            <p className="text-xs text-slate-500">Chat directly with the property owner</p>
                        </div>
                    </div>
                    <div>
                        {features.directMessage ? (
                            <span className="text-violet-600 text-sm font-bold flex items-center gap-1 bg-violet-50 px-3 py-1 rounded-full">
                                <CheckCircle2 className="w-4 h-4" /> Available
                            </span>
                        ) : (
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                Unlock Feature
                            </span>
                        )}
                    </div>
                </div>

            </div>

            <UpgradeModal
                isOpen={!!upgradeFeature}
                onClose={() => setUpgradeFeature(null)}
                featureName={upgradeFeature || ''}
                description="This feature is not available on the owner's current plan."
            />

            {/* We import OfferModal directly to use it here too if needed, or we explicitly don't since it's already in PropertyValuationSection?
                The user wants "Make an offer option is missing... create a Features section... if they are included... show widgets OR prompt to upgrade."
                If I click "Make an Offer" here, it should open the modal.
            */}
            {/* Note: OfferModal needs to be imported. Based on list_dir: app/components/OfferModal.tsx */}
            {/* I will assume it's exposed or I need to import it. */}
            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                propertyId={propertyId}
                propertyTitle={propertyTitle}
                currencySymbol={currency === 'USD' ? '$' : '€'}
            />
        </div>
    );
}


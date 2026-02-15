'use client';

import { useState } from 'react';
import { BadgeDollarSign, Video, MessageCircle, ShieldCheck, Lock, CheckCircle2, Users, BarChart2, TrendingUp, Calendar, Calculator, Target, Eye } from 'lucide-react';
import { SYSTEM_FEATURES } from '@/app/lib/auth/feature-keys';
import UpgradeModal from './UpgradeModal';
// OfferModal is in the same directory (app/components) based on list_dir
import OfferModal from './OfferModal';

interface PropertyFeaturesProps {
    propertyId: string;
    ownerId: string;
    features: Record<string, boolean>;
    propertyTitle?: string;
    currency?: string;
    propertyFeatures?: string[];
}

export default function PropertyFeatures({ propertyId, ownerId, features, propertyTitle = '', currency = 'USD', propertyFeatures = [] }: PropertyFeaturesProps) {
    const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFeatureClick = (feature: string, hasAccess: boolean, action?: () => void) => {
        if (!hasAccess) {
            setUpgradeFeature(feature);
        } else if (action) {
            action();
        }
    };

    const FEATURE_CONFIG: Record<string, { label: string, description: string, icon: any, color: string, action?: string }> = {
        [SYSTEM_FEATURES.VIEW_OWNER_CONTACT]: {
            label: 'View Owner Contact Info',
            description: 'Identity of the property owner and direct contact details',
            icon: Eye,
            color: 'blue'
        },
        [SYSTEM_FEATURES.LEADS_ACCESS]: {
            label: 'Leads Access',
            description: 'Manage and communicate with potential buyers',
            icon: Users,
            color: 'indigo'
        },
        [SYSTEM_FEATURES.DIRECT_MESSAGE]: {
            label: 'Direct Message',
            description: 'Chat directly with the property owner',
            icon: MessageCircle,
            color: 'violet'
        },
        [SYSTEM_FEATURES.CALENDAR_EVENTS]: {
            label: 'Calendar Events',
            description: 'Schedule and track property related viewings',
            icon: Calendar,
            color: 'rose'
        },
        [SYSTEM_FEATURES.VALUATION_REPORTS]: {
            label: 'Valuation Reports',
            description: 'Detailed analysis of property market value',
            icon: BarChart2,
            color: 'amber'
        },
        [SYSTEM_FEATURES.MARKET_INSIGHTS]: {
            label: 'Market Insights',
            description: 'Real-time data on local property trends',
            icon: TrendingUp,
            color: 'emerald'
        },
        [SYSTEM_FEATURES.MAKE_AN_OFFER]: {
            label: 'Make an Offer',
            description: 'Submit a formal price offer directly to the owner',
            icon: BadgeDollarSign,
            color: 'emerald',
            action: 'offer'
        },
        [SYSTEM_FEATURES.VIRTUAL_TOUR]: {
            label: 'Virtual Tour Hosting',
            description: 'Immersive 3D walkthrough experience',
            icon: Video,
            color: 'blue',
            action: 'tour'
        },
        [SYSTEM_FEATURES.PROPERTY_INSIGHTS]: {
            label: 'Property Insights',
            description: 'Analytics on property performance',
            icon: TrendingUp,
            color: 'purple'
        },
        [SYSTEM_FEATURES.PROPERTY_PRICE_CALCULATOR]: {
            label: 'Property Price Calculator',
            description: 'Estimate property value based on inputs',
            icon: Calculator,
            color: 'indigo'
        },
        [SYSTEM_FEATURES.TARGET_MARKETING]: {
            label: 'Target Marketing',
            description: 'Reach specific buyer personas for this property',
            icon: Target,
            color: 'rose'
        }
    };

    const getColorClasses = (color: string, active: boolean) => {
        if (!active) return 'bg-slate-100 text-slate-400';
        const classes: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-600',
            indigo: 'bg-indigo-100 text-indigo-600',
            violet: 'bg-violet-100 text-violet-600',
            emerald: 'bg-emerald-100 text-emerald-600',
            rose: 'bg-rose-100 text-rose-600',
            amber: 'bg-amber-100 text-amber-600',
            purple: 'bg-purple-100 text-purple-600',
        };
        return classes[color] || 'bg-slate-100 text-slate-600';
    };

    const getBadgeColorClasses = (color: string) => {
        const classes: Record<string, string> = {
            blue: 'text-blue-600 bg-blue-50',
            indigo: 'text-indigo-600 bg-indigo-50',
            violet: 'text-violet-600 bg-violet-50',
            emerald: 'text-emerald-600 bg-emerald-50',
            rose: 'text-rose-600 bg-rose-50',
            amber: 'text-amber-600 bg-amber-50',
            purple: 'text-purple-600 bg-purple-50',
        };
        return classes[color] || 'text-slate-600 bg-slate-50';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
            <div
                className="p-6 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-none">Platform Features</h3>
                    <p className="text-sm text-slate-500 mt-1">Available interactions and property amenities</p>
                </div>
                <div className={`p-2 rounded-full bg-slate-100 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>

                <div className="divide-y divide-gray-100">
                    {Object.entries(FEATURE_CONFIG).map(([key, config]) => {
                        const hasAccess = features[key] || false;
                        const Icon = config.icon;

                        const performAction = () => {
                            if (config.action === 'offer') setIsOfferModalOpen(true);
                            if (config.action === 'tour') document.getElementById('virtual-tour-section')?.scrollIntoView({ behavior: 'smooth' });
                        };

                        return (
                            <div
                                key={key}
                                onClick={() => handleFeatureClick(config.label, hasAccess, performAction)}
                                className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl transition-colors ${getColorClasses(config.color, hasAccess)}`}>
                                        {hasAccess ? <Icon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold transition-colors ${hasAccess ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-400'}`}>
                                            {config.label}
                                        </h4>
                                        <p className="text-xs text-slate-500">{config.description}</p>
                                    </div>
                                </div>
                                <div>
                                    {hasAccess ? (
                                        <span className={`text-sm font-bold flex items-center gap-1 px-3 py-1 rounded-full ${getBadgeColorClasses(config.color)}`}>
                                            <CheckCircle2 className="w-4 h-4" /> Available
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-sm font-medium flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            Unlock Feature
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Property Features Synchronization */}
                {propertyFeatures && propertyFeatures.length > 0 && (
                    <div className="p-6 bg-slate-50/50 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">Included Amenities</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {propertyFeatures.map((feature, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
        </div>
    );
}

'use client';

import { useState } from 'react';
import {
    Check,
    ChevronDown,
    ChevronUp,
    Tag,
    Home,
    Users,
    Dumbbell,
    Shield,
    Sparkles
} from 'lucide-react';

interface PropertyAmenitiesProps {
    features: string[];
}

const FEATURE_CATEGORIES: Record<string, string[]> = {
    'Listing Tags': ['Commission 0%', 'Exclusive', 'Foreclosure', 'Hotel Regime', 'Luxury', 'Open to Collaboration'],
    'Unit Features': ['Air Conditioning', 'Balcony', 'Central Heating', 'Fireplace', 'Garage', 'Jacuzzi', 'Laundry', 'Parking', 'Private Pool', 'Sauna', 'Storage'],
    'Community & Recreation': ['Amphitreater', 'Clubhouse', 'Common Garden', 'Jogging Track', 'Library', 'Park', 'Party Hall', 'Playground'],
    'Sports & Fitness': ['Basketball Court', 'Football Field', 'Gym', 'Squash Court', 'Swimming Pool', 'Tennis Court', 'Yoga Deck'],
    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Gated Community', 'Intercom', 'Shelter', 'Video Door Phone'],
    'Sustainability & Services': ['Concierge', 'Elevator', 'Green Building', 'Maintenance Staff', 'Power Backup', 'Rainwater Harvesting', 'Sewage Treatment', 'Smart Home', 'Solar Panels', 'Visitor Parking']
};

const CATEGORY_STYLES: Record<string, { bg: string, border: string, text: string, iconBg: string, iconColor: string, icon: any }> = {
    'Listing Tags': {
        bg: 'bg-blue-50/50',
        border: 'border-blue-100',
        text: 'text-blue-900',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        icon: Tag
    },
    'Unit Features': {
        bg: 'bg-violet-50/50',
        border: 'border-violet-100',
        text: 'text-violet-900',
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
        icon: Home
    },
    'Community & Recreation': {
        bg: 'bg-emerald-50/50',
        border: 'border-emerald-100',
        text: 'text-emerald-900',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        icon: Users
    },
    'Sports & Fitness': {
        bg: 'bg-orange-50/50',
        border: 'border-orange-100',
        text: 'text-orange-900',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        icon: Dumbbell
    },
    'Security & Safety': {
        bg: 'bg-rose-50/50',
        border: 'border-rose-100',
        text: 'text-rose-900',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
        icon: Shield
    },
    'Sustainability & Services': {
        bg: 'bg-cyan-50/50',
        border: 'border-cyan-100',
        text: 'text-cyan-900',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
        icon: Sparkles
    }
};

export default function PropertyAmenities({ features }: PropertyAmenitiesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasAnyFeatures = Object.values(FEATURE_CATEGORIES).some(catFeatures =>
        catFeatures.some(f => features.includes(f))
    );

    if (!hasAnyFeatures) return null;

    return (
        <div className="space-y-6">
            <style jsx global>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-15%); }
                    50% { transform: translateY(0); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                }
            `}</style>

            <div
                className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Decorative background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-r from-indigo-50/20 to-violet-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isExpanded
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:shadow-lg group-hover:shadow-indigo-100/50'
                            }`}>
                            <Sparkles className={`w-6 h-6 ${isExpanded ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold tracking-tight transition-colors duration-500 ${isExpanded ? 'text-slate-900' : 'text-indigo-600 group-hover:text-indigo-700'
                                }`}>Features & Amenities</h2>
                            <p className="text-sm text-slate-500 font-medium">Explore the property's unique characteristics</p>
                        </div>
                    </div>

                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400'
                        }`}>
                        <ChevronDown className={`w-6 h-6 transition-transform ${!isExpanded ? 'animate-bounce-slow text-indigo-500' : ''}`} />
                        {!isExpanded && (
                            <div className="absolute inset-0 rounded-xl ring-2 ring-indigo-500/20 animate-ping opacity-20" />
                        )}
                    </div>
                </div>
            </div>

            <div
                className={`space-y-4 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'
                    }`}
            >
                <div className="grid grid-cols-1 gap-4">
                    {Object.entries(FEATURE_CATEGORIES).map(([category, categoryFeatures]) => {
                        const matchedFeatures = categoryFeatures.filter(f => features.includes(f));
                        if (matchedFeatures.length === 0) return null;

                        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Unit Features'];

                        return (
                            <div
                                key={category}
                                className={`group/category relative border ${style.border} rounded-3xl p-6 ${style.bg} transition-all duration-300 hover:shadow-lg hover:shadow-slate-100`}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg} shadow-sm group-hover/category:scale-110 transition-transform duration-300`}>
                                        <style.icon className={`w-5 h-5 ${style.iconColor}`} />
                                    </div>
                                    <h3 className={`text-lg font-bold ${style.text}`}>{category}</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                                    {matchedFeatures.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 group/item">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg} group-hover/item:bg-white transition-colors duration-200`}>
                                                <Check className={`w-3.5 h-3.5 ${style.iconColor}`} />
                                            </div>
                                            <span className={`font-medium text-sm transition-colors duration-200 ${style.text} group-hover/item:translate-x-1 inline-block`}>
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

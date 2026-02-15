'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

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

const CATEGORY_STYLES: Record<string, { bg: string, border: string, text: string, iconBg: string, iconColor: string }> = {
    'Listing Tags': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', iconBg: 'bg-blue-200', iconColor: 'text-blue-700' },
    'Unit Features': { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-900', iconBg: 'bg-violet-200', iconColor: 'text-violet-700' },
    'Community & Recreation': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-900', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700' },
    'Sports & Fitness': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-900', iconBg: 'bg-orange-200', iconColor: 'text-orange-700' },
    'Security & Safety': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-900', iconBg: 'bg-rose-200', iconColor: 'text-rose-700' },
    'Sustainability & Services': { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-900', iconBg: 'bg-cyan-200', iconColor: 'text-cyan-700' }
};

export default function PropertyAmenities({ features }: PropertyAmenitiesProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasAnyFeatures = Object.values(FEATURE_CATEGORIES).some(catFeatures =>
        catFeatures.some(f => features.includes(f))
    );

    if (!hasAnyFeatures) return null;

    return (
        <div className="space-y-6">
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h2 className="text-2xl font-bold text-slate-900">Features & Amenities</h2>
                <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-slate-100' : 'group-hover:bg-slate-50'}`}>
                    {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                    )}
                </div>
            </div>

            <div
                className={`space-y-4 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                {Object.entries(FEATURE_CATEGORIES).map(([category, categoryFeatures]) => {
                    const matchedFeatures = categoryFeatures.filter(f => features.includes(f));
                    if (matchedFeatures.length === 0) return null;

                    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Unit Features'];

                    return (
                        <div key={category} className={`border ${style.border} rounded-2xl p-6 ${style.bg}`}>
                            <h3 className={`text-lg font-bold mb-4 ${style.text}`}>{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
                                {matchedFeatures.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${style.iconBg}`}>
                                            <Check className={`w-3.5 h-3.5 ${style.iconColor}`} />
                                        </div>
                                        <span className={`font-medium text-sm ${style.text}`}>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

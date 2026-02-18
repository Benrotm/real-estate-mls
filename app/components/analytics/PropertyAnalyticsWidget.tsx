'use client';

import { Eye, Calendar, Heart, MessageCircle, DollarSign, Share2, Calculator } from 'lucide-react';

interface PropertyAnalyticsWidgetProps {
    views: number;
    favorites: number;
    inquiries: number;
    offers: number;
    shares: number;
    createdAt: string | null;
    price?: number;
    area?: number | null;
}

export default function PropertyAnalyticsWidget({
    views,
    favorites,
    inquiries,
    offers,
    shares,
    createdAt,
    price,
    area
}: PropertyAnalyticsWidgetProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate Price/Sqm
    const pricePerSqm = (price && area && area > 0)
        ? Math.round(price / area)
        : null;

    const stats: { icon: any; label: string; value: number | string; color: string; bg: string }[] = [
        { icon: Eye, label: 'Views', value: views, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { icon: Heart, label: 'Favorites', value: favorites, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { icon: MessageCircle, label: 'Inquiries', value: inquiries, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { icon: DollarSign, label: 'Offers', value: offers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { icon: Share2, label: 'Shares', value: shares, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    if (pricePerSqm) {
        stats.push({
            icon: Calculator,
            label: 'Price / Sqm',
            value: pricePerSqm.toLocaleString(),
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10'
        });
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Property Insights
            </h3>

            {/* Listed Date */}
            <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listed</div>
                    <div className="text-sm font-bold text-slate-900">{formatDate(createdAt)}</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                        <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-xs font-medium text-slate-500">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

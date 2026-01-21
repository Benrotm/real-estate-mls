'use client';

import Link from 'next/link';
import { BarChart } from 'lucide-react';

interface HomeValuationWidgetProps {
    linkPath?: string;
    variant?: 'default' | 'home';
}

export default function HomeValuationWidget({ linkPath = "/dashboard/owner/valuation", variant = 'default' }: HomeValuationWidgetProps) {
    if (variant === 'home') {
        return (
            <Link href={linkPath} className="block w-full max-w-md mx-auto group">
                <div className="relative bg-slate-900 rounded-2xl p-6 border border-fuchsia-500/30 overflow-hidden shadow-2xl shadow-fuchsia-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-fuchsia-500/40">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30 group-hover:rotate-6 transition-transform">
                            <BarChart className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-fuchsia-300 transition-colors">Property Price Calculator</h3>
                            <p className="text-fuchsia-200/70 text-sm">AI-powered price insights for any property.</p>
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    // Default Dashboard Variant
    return (
        <Link href={linkPath} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group max-w-md mx-auto w-full">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BarChart className="w-8 h-8" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Valuation Reports</h3>
                <p className="text-slate-500 text-sm">AI-powered estimates for your properties.</p>
            </div>
        </Link>
    );
}

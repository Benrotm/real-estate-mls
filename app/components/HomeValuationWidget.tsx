'use client';

import Link from 'next/link';
import { BarChart } from 'lucide-react';

interface HomeValuationWidgetProps {
    linkPath?: string;
}

export default function HomeValuationWidget({ linkPath = "/dashboard/owner/valuation" }: HomeValuationWidgetProps) {
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

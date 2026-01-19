'use client';

import ValuationWidget from '@/app/components/ValuationWidget';
import { MOCK_PROPERTIES } from '@/app/lib/properties';

export default function DeveloperValuationPage() {
    // Developers might want to value land or large projects, but for MVP consistency we show the same widget
    const property = MOCK_PROPERTIES[0];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Project Valuation & Feasibility</h1>
                <p className="text-slate-500 mt-2">
                    Market value estimations for potential developments and current assets.
                </p>
            </div>

            {/* Reuse the exact same widget component as requested */}
            <ValuationWidget property={property} />

            <div className="mt-8 text-center text-sm text-slate-400">
                <p>Valuation Model: Residential Comparative Market Analysis</p>
            </div>
        </div>
    );
}

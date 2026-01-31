'use client';

import ValuationWidget from '@/app/components/ValuationWidget';
import { MOCK_PROPERTIES } from '@/app/lib/properties';

export default function ValuationPage() {
    // For MVP/Demo purposes, we'll pick the first property from our mock data
    // In a real app, this would likely let you select from your properties or show a list
    const property = MOCK_PROPERTIES[0];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Property Valuation Reports</h1>
                <p className="text-slate-500 mt-2">
                    Get real-time market value estimates and investment insights for your properties.
                </p>
            </div>

            {/* Reuse the exact same widget component as requested */}
            <ValuationWidget property={property} />

            {/* Placeholder for future list if multiple properties */}
            <div className="mt-8 text-center text-sm text-slate-400">
                <p>Viewing valuation for: {property.title}</p>
            </div>
        </div>
    );
}

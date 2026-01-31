'use client';

import ValuationWidget from '@/app/components/ValuationWidget';
import { MOCK_PROPERTIES } from '@/app/lib/properties';

export default function AgentValuationPage() {
    // For MVP/Demo purposes, we'll pick the first property from our mock data
    // In a real app, this might show a list of client properties or allow address lookup
    const property = MOCK_PROPERTIES[0];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Agent Valuation Tools</h1>
                <p className="text-slate-500 mt-2">
                    Professional valuation estimates and market analysis for your listings.
                </p>
            </div>

            {/* Reuse the exact same widget component as requested */}
            <ValuationWidget property={property} />

            {/* Placeholder for future list if multiple properties */}
            <div className="mt-8 text-center text-sm text-slate-400">
                <p>Analyzing: {property.title}</p>
            </div>
        </div>
    );
}

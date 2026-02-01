'use client';

import { useState } from 'react';
import ImportPropertiesModal from '@/app/components/properties/ImportPropertiesModal';
import AddPropertyForm from './AddPropertyForm';
import { Property } from '@/app/lib/properties';

export default function AddPropertyClient() {
    const [scrapedData, setScrapedData] = useState<Partial<Property> | null>(null);

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Add New Property</h1>
                    <p className="text-slate-500">Fill in the details below to list your property regardless of type.</p>
                </div>
                <ImportPropertiesModal onScrapeSuccess={(data) => setScrapedData(data as unknown as Partial<Property>)} />
            </div>

            <AddPropertyForm
                initialData={scrapedData || undefined}
                key={scrapedData ? `scraped-${JSON.stringify(scrapedData.title)}` : 'default'}
            />
        </div>
    );
}

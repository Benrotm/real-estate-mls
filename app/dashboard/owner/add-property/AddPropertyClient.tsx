'use client';

import { useState } from 'react';
import ImportPropertiesModal from '@/app/components/properties/ImportPropertiesModal';
import AddPropertyForm from './AddPropertyForm';
import { Property } from '@/app/lib/properties';

export default function AddPropertyClient() {
    const [scrapedData, setScrapedData] = useState<Partial<Property> | null>(null);

    return (
        <div className="relative min-h-screen">
            <div className="absolute top-28 right-4 sm:right-6 lg:right-8 z-50">
                <ImportPropertiesModal onScrapeSuccess={(data) => setScrapedData(data as unknown as Partial<Property>)} />
            </div>

            <AddPropertyForm
                initialData={scrapedData || undefined}
                key={scrapedData ? `scraped-${JSON.stringify(scrapedData.title)}` : 'default'}
            />
        </div>
    );
}

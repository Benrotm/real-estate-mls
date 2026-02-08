'use client';

import { useEffect } from 'react';
import { recordPropertyView } from '@/app/lib/actions/propertyAnalytics';

interface PropertyViewTrackerProps {
    propertyId: string;
}

export default function PropertyViewTracker({ propertyId }: PropertyViewTrackerProps) {
    useEffect(() => {
        // Generate a simple session hash for deduplication
        const sessionHash = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Record the view
        recordPropertyView(propertyId, sessionHash);
    }, [propertyId]);

    // This component renders nothing - just tracks the view
    return null;
}

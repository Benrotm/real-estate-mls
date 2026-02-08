'use client';

import { useEffect } from 'react';
import { recordPropertyView } from '@/app/lib/actions/propertyAnalytics';

interface PropertyViewTrackerProps {
    propertyId: string;
}

export default function PropertyViewTracker({ propertyId }: PropertyViewTrackerProps) {
    useEffect(() => {
        // Use a persistent session hash to prevent duplicate views from the same browser
        const storageKey = `pv_hash_${propertyId}`;
        const lastView = localStorage.getItem(storageKey);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        let sessionHash: string;

        if (lastView) {
            const { hash, timestamp } = JSON.parse(lastView);
            if (now - timestamp < oneDay) {
                // already viewed within 24h, skip recording OR use same hash
                // we'll record once per 24h per session hash in the action too
                sessionHash = hash;
            } else {
                sessionHash = `s_${now}_${Math.random().toString(36).substring(7)}`;
            }
        } else {
            sessionHash = `s_${now}_${Math.random().toString(36).substring(7)}`;
        }

        localStorage.setItem(storageKey, JSON.stringify({ hash: sessionHash, timestamp: now }));

        // Record the view
        recordPropertyView(propertyId, sessionHash);
    }, [propertyId]);

    // This component renders nothing - just tracks the view
    return null;
}

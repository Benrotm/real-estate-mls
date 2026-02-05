'use client';

import { syncPlanFeatures } from '@/app/lib/admin';
import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SyncFeaturesButton() {
    const [isPending, startTransition] = useTransition();

    const handleSync = () => {
        startTransition(async () => {
            if (confirm('This will standardize features across all plans: adding missing ones and removing duplicates. Continue?')) {
                await syncPlanFeatures();
            }
        });
    };

    return (
        <button
            onClick={handleSync}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all ml-4"
            title="Fix consistency issues across plans"
        >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Syncing...' : 'Sync All Plans'}
        </button>
    );
}

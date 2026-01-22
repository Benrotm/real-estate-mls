'use client';

import { updatePlanFeature } from '@/app/lib/admin';
import { startTransition, useOptimistic } from 'react';

export function FeatureToggle({ feature }: { feature: any }) {
    const [isEnabled, setOptimistic] = useOptimistic(
        feature.is_included,
        (state, newState: boolean) => newState
    );

    const toggle = async () => {
        startTransition(() => {
            setOptimistic(!isEnabled);
            updatePlanFeature(feature.id, !isEnabled);
        });
    };

    return (
        <label className="flex items-center justify-between cursor-pointer group">
            <span className={`text-sm ${isEnabled ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                {feature.feature_label}
            </span>
            <input
                type="checkbox"
                checked={isEnabled}
                onChange={toggle}
                className="hidden"
            />
            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ${isEnabled ? 'bg-purple-600' : 'bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
        </label>
    );
}

'use client';

import React, { useState } from 'react';
import { AppWindow, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { deleteGlobalFeature, updatePlanFeaturesOrder } from '@/app/lib/admin';

interface FeatureItem {
    key: string;
    label: string;
    totalPlans: number;
    enabledCount: number;
}

interface FeaturesListClientProps {
    initialFeatures: FeatureItem[];
}

export default function FeaturesListClient({ initialFeatures }: FeaturesListClientProps) {
    const [features, setFeatures] = useState(initialFeatures);
    const [deletingKey, setDeletingKey] = useState<string | null>(null);

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= features.length) return;

        const updated = [...features];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;

        setFeatures(updated);

        const listToUpdate = updated.map((f, idx) => ({
            key: f.key,
            sort_order: idx + 1
        }));

        try {
            await updatePlanFeaturesOrder(listToUpdate);
        } catch (e: any) {
            alert('Failed to save order: ' + e.message);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm('Are you sure you want to delete this global feature?')) return;
        setDeletingKey(key);
        try {
            await deleteGlobalFeature(key);
            setFeatures(prev => prev.filter(f => f.key !== key));
        } catch (err: any) {
            alert('Failed to delete: ' + err.message);
        } finally {
            setDeletingKey(null);
        }
    };

    return (
        <div className="grid gap-4">
            {features.map((feature, idx) => (
                <div key={feature.key} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between group hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* Order buttons */}
                        <div className="flex flex-col gap-1 mr-2">
                            <button
                                onClick={() => handleMove(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Up"
                            >
                                <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleMove(idx, 'down')}
                                disabled={idx === features.length - 1}
                                className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Move Down"
                            >
                                <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                            <AppWindow className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-lg font-bold">{feature.label}</h3>
                            <code className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                {feature.key}
                            </code>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <div className="text-sm font-medium text-slate-300">
                                Enabled on <span className="text-white font-bold">{feature.enabledCount}</span> / {feature.totalPlans} plans
                            </div>
                            <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${(feature.enabledCount / feature.totalPlans) * 100}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleDelete(feature.key)}
                            disabled={deletingKey === feature.key}
                            className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
                            title="Delete Global Feature"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}

            {features.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    No features found. Creates one to get started.
                </div>
            )}
        </div>
    );
}

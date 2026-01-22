'use client';

import { updatePlanDetails, deletePlan } from '@/app/lib/admin';
import { useState, useTransition } from 'react';
import { Check, Trash2 } from 'lucide-react';

interface PlanEditorProps {
    plan: any;
}

export default function PlanEditor({ plan }: PlanEditorProps) {
    const [price, setPrice] = useState(plan.price);
    const [description, setDescription] = useState(plan.description);
    const [listingsLimit, setListingsLimit] = useState(plan.listings_limit || 1);
    const [featuredLimit, setFeaturedLimit] = useState(plan.featured_limit || 0);
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        startTransition(async () => {
            await updatePlanDetails(plan.id, {
                price: Number(price),
                description,
                listings_limit: Number(listingsLimit),
                featured_limit: Number(featuredLimit)
            });
        });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm(`Are you sure you want to delete the plan "${plan.name}"? This cannot be undone.`)) {
            startTransition(async () => {
                try {
                    const result = await deletePlan(plan.id);
                    if (result && !result.success) {
                        alert(`Failed to delete plan: ${result.error}`);
                        console.error('Server reported error:', result.error);
                    } else {
                        console.log('🚀 Delete action completed successfully.');
                    }
                } catch (err) {
                    console.error('❌ Error calling deletePlan:', err);
                    alert('An unexpected network error occurred.');
                }
            });
        }
    };

    return (
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold mb-4">{plan.name} Plan</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Price ($)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Active Listings Limit</label>
                    <input
                        type="number"
                        value={listingsLimit}
                        onChange={(e) => setListingsLimit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Featured Listings Limit</label>
                    <input
                        type="number"
                        value={featuredLimit}
                        onChange={(e) => setFeaturedLimit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                </div>
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Saving...' : <><Check size={16} /> Save Changes</>}
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="px-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                        title="Delete Plan"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

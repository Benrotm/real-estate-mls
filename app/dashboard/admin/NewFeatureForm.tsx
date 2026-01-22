'use client';

import { addPlanFeature } from '@/app/lib/admin';
import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';

export default function NewFeatureForm({ role, planName }: { role: string, planName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [label, setLabel] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim()) return;

        startTransition(async () => {
            await addPlanFeature({
                role,
                plan_name: planName,
                feature_label: label,
                feature_key: label.toLowerCase().replace(/\s+/g, '_')
            });
            setLabel('');
            setIsOpen(false);
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-2 mt-2 border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
                <Plus className="w-4 h-4" /> Add Feature
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-2 p-3 bg-slate-900 rounded-lg border border-slate-700 animate-in fade-in zoom-in-95 duration-200">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Feature Name</label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. Priority Support"
                    autoFocus
                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm outline-none focus:border-cyan-500 text-white"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-cyan-600 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-cyan-500 disabled:opacity-50"
                >
                    {isPending ? '...' : <Plus className="w-4 h-4" />}
                </button>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded text-sm hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
}

'use client';

import { createGlobalFeature } from '@/app/lib/admin';
import { useState, useTransition } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

export default function AddGlobalFeatureForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [label, setLabel] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!label.trim()) return;
        setError(null);

        startTransition(async () => {
            try {
                await createGlobalFeature(label);
                setLabel('');
                setIsOpen(false);
            } catch (err: any) {
                setError(err.message || 'Failed to create feature');
            }
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
            >
                <Plus className="w-5 h-5" />
                Add New Feature
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <form
                onSubmit={handleSubmit}
                className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Add Global Feature</h3>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Feature Label
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="e.g. Advanced Analytics"
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        This feature will be added to <strong>ALL existing plans</strong> as "Disabled" by default. You can enable it per-plan in Plan Settings.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-slate-300 hover:text-white"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isPending || !label.trim()}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Feature
                    </button>
                </div>
            </form>
        </div>
    );
}

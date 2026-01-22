'use client';

import { createPlan } from '@/app/lib/admin';
import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';

export default function NewPlanForm({ role }: { role: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('0');
    const [description, setDescription] = useState('');
    const [listingsLimit, setListingsLimit] = useState('1');
    const [featuredLimit, setFeaturedLimit] = useState('0');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            await createPlan({
                role,
                name,
                price: Number(price),
                description,
                listings_limit: Number(listingsLimit),
                featured_limit: Number(featuredLimit)
            });
            // Reset and close
            setName('');
            setPrice('0');
            setDescription('');
            setListingsLimit('1');
            setFeaturedLimit('0');
            setIsOpen(false);
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full h-full min-h-[250px] bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer"
            >
                <div className="p-4 bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-slate-400 group-hover:text-cyan-400" />
                </div>
                <div className="text-slate-400 font-bold group-hover:text-cyan-400">Add New Plan</div>
            </button>
        );
    }

    return (
        <div className="bg-slate-950 p-6 rounded-xl border border-cyan-500/50 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
                <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg"><Plus className="w-5 h-5 text-cyan-400" /></div>
                Create {role} Plan
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Plan Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Enterprise Plus"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Price ($)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Listings Limit</label>
                        <input
                            type="number"
                            value={listingsLimit}
                            onChange={e => setListingsLimit(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Featured Limit</label>
                        <input
                            type="number"
                            value={featuredLimit}
                            onChange={e => setFeaturedLimit(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Brief summary..."
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg"
                >
                    {isPending ? 'Creating...' : 'Create Plan'}
                </button>
            </form>
        </div>
    );
}

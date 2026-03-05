'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Star, Clock, Euro } from 'lucide-react';

export default function PropertySortToggle() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || 'newest';

    const sortOptions = [
        { id: 'score_desc', label: 'Best Score', icon: Star },
        { id: 'newest', label: 'New Added', icon: Clock },
        { id: 'price_asc', label: 'Price', icon: Euro },
    ];

    const handleSortChange = (sortId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', sortId);
        params.delete('page'); // Reset to first page when sorting
        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
            {sortOptions.map((option) => {
                const Icon = option.icon;
                const isActive = currentSort === option.id;

                return (
                    <button
                        key={option.id}
                        onClick={() => handleSortChange(option.id)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300
                            ${isActive
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md transform scale-105'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                            }
                        `}
                    >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

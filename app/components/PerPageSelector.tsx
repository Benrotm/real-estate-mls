'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function PerPageSelector({ currentValue }: { currentValue: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('per_page', e.target.value);
        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Show</span>
            <select
                value={currentValue}
                onChange={handleChange}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none cursor-pointer"
            >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
            </select>
            <span>per page</span>
        </div>
    );
}

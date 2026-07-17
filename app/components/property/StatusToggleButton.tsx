'use client';

import { useTransition } from 'react';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import { togglePropertyStatus } from '@/app/lib/actions/properties';

export default function StatusToggleButton({
    propertyId,
    currentStatus
}: {
    propertyId: string;
    currentStatus: 'active' | 'draft';
}) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        startTransition(async () => {
            const res = await togglePropertyStatus(propertyId, currentStatus);
            if (res && res.error) {
                alert(`Error: ${res.error}`);
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-slate-600 transition duration-300 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
            ) : currentStatus === 'draft' ? (
                <Sparkles className="w-4 h-4 text-orange-400" />
            ) : (
                <FileText className="w-4 h-4 text-violet-400" />
            )}
            <span>{currentStatus === 'draft' ? 'PUBLISH LISTING' : 'SAVE DRAFT'}</span>
        </button>
    );
}

'use client';

import { useState } from 'react';
import { EyeOff, Eye, Loader2 } from 'lucide-react';
import { togglePropertyStatus } from '@/app/lib/actions/properties';
import { useRouter } from 'next/navigation';

interface PropertyManageButtonsProps {
    propertyId: string;
    status: 'active' | 'draft';
}

export default function PropertyManageButtons({ propertyId, status }: PropertyManageButtonsProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        try {
            const result = await togglePropertyStatus(propertyId, status);
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh(); // Ensure the UI updates
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update property status');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'draft') {
        return (
            <button
                onClick={handleToggle}
                disabled={loading}
                className="flex-1 text-center text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 hover:shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-red-200"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                Publish
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className="flex-1 text-center text-green-600 font-bold py-3 rounded-xl hover:bg-green-50 hover:shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-green-200"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
            Unpublish
        </button>
    );
}

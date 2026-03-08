'use client';

import { Trash2 } from 'lucide-react';
import { deleteLeadAdmin } from '@/app/lib/actions/admin';
import { useState } from 'react';

interface DeleteLeadButtonProps {
    leadId: string;
}

export default function DeleteLeadButton({ leadId }: DeleteLeadButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this lead?')) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteLeadAdmin(leadId);
        } catch (error) {
            console.error('Failed to delete lead:', error);
            alert('Failed to delete lead. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete Lead"
        >
            <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
        </button>
    );
}

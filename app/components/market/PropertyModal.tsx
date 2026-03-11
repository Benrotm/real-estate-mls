'use client';

import { X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';
import Link from 'next/link';

interface PropertyModalProps {
    propertyId: string;
    onClose: () => void;
}

export default function PropertyModal({ propertyId, onClose }: PropertyModalProps) {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <Link
                        href={`/properties/${propertyId}`}
                        target="_blank"
                        className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-sm font-bold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        <span>Open in New Tab</span>
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-700 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Iframe for Property Content */}
                <div className="flex-1 w-full bg-slate-50">
                    <iframe
                        src={`/properties/${propertyId}?modal=true`}
                        className="w-full h-full border-none"
                        title="Property Details"
                    />
                </div>
            </div>
        </div>
    );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath?: string;
}

export default function Pagination({ currentPage, totalPages, basePath = '/properties' }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    if (totalPages <= 1) return null;

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page.toString());
        router.push(`${basePath}?${params.toString()}`);
    };

    // Build page numbers to show (max 7 pages with ellipsis)
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-1 mt-10">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
                <ChevronLeft className="w-4 h-4" />
                Prev
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-slate-400 text-sm">…</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-bold cursor-pointer transition-all ${page === currentPage
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-110'
                            }`}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-violet-100 hover:text-violet-700 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
                Next
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-md">
                <h2 className="text-xl font-bold text-red-800 mb-2">Access Error</h2>
                <p className="text-red-600 mb-6">{error.message || 'An unexpected error occurred.'}</p>
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}

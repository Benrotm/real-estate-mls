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
                <p className="text-red-600 mb-2">{error.message || 'An unexpected error occurred.'}</p>
                <div className="text-xs text-red-500 mb-6 bg-red-50 p-2 rounded border border-red-100">
                    <p className="font-bold mb-1">Troubleshooting:</p>
                    <ul className="list-disc list-inside text-left">
                        <li>Your account likely lacks the <strong>super_admin</strong> role.</li>
                        <li>Database permissions might be insufficient.</li>
                    </ul>
                    {error.digest && <div className="mt-2 pt-2 border-t border-red-200 font-mono text-[10px]">Digest: {error.digest}</div>}
                </div>
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

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
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl border border-rose-500/30 p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-rose-500 mb-4">Something went wrong!</h2>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 overflow-x-auto mb-6">
          <p className="text-rose-400 font-mono text-sm mb-2 font-bold">{error.name}: {error.message}</p>
          <pre className="text-slate-400 font-mono text-xs whitespace-pre-wrap">{error.stack}</pre>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Please take a screenshot of this entire box and send it to the developer!
        </p>
        <button
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded-xl transition-colors"
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </button>
      </div>
    </div>
  );
}

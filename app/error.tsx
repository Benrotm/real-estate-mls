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
    console.error("Global Error Caught:", error);

    // Auto-recover from Safari/DOM removeChild errors without crashing UI
    if (
      error?.name === 'NotFoundError' || 
      error?.message?.includes('removeChild') || 
      error?.message?.includes('Obiectul nu poate fi găsit')
    ) {
      console.warn("Auto-recovering from DOM removeChild error");
      reset();
    }
  }, [error, reset]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-rose-500/30 p-6 sm:p-8 shadow-2xl space-y-4 text-center">
        <h2 className="text-xl font-bold text-rose-400">Ceva nu a mers bine!</h2>
        <p className="text-slate-300 text-xs sm:text-sm">
          A apărut o mică eroare de afișare. Apasă pe butonul de mai jos pentru a reîncărca modulul.
        </p>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left overflow-x-auto">
          <p className="text-rose-400 font-mono text-xs font-bold">{error.name}: {error.message}</p>
        </div>
        <button
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-3 px-6 rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20"
          onClick={() => reset()}
        >
          Reîncearcă acum
        </button>
      </div>
    </div>
  );
}

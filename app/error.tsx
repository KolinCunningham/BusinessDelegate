'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CragTrails error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[#f8f5f0]">
      <div className="w-20 h-20 rounded-full bg-[#fef3c7] flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-[#b45309]" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-[-1.5px] mb-3 text-[#1c2526]">
        Oops! Something went sideways.
      </h1>
      
      <p className="text-xl text-[#5c6666] max-w-md mb-8">
        Even the best climbing days have a little slip. Don&apos;t worry — we&apos;ll get you back on the wall.
      </p>

      <button
        onClick={() => reset()}
        className="flex items-center gap-3 px-10 py-4 rounded-full bg-[#166534] text-white text-lg font-bold active:scale-[0.985] transition"
      >
        <RefreshCw className="w-5 h-5" />
        Try Again
      </button>

      <p className="mt-8 text-sm text-[#78716c]">
        If this keeps happening, the route might be a bit too hard right now. Shake your phone and try later!
      </p>
    </div>
  );
}

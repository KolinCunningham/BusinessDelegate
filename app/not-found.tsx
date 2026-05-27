import Link from 'next/link';
import { MapPin, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[#f8f5f0]">
      <div className="w-20 h-20 rounded-full bg-[#e0e7ff] flex items-center justify-center mb-6">
        <MapPin className="w-10 h-10 text-[#4338ca]" />
      </div>

      <h1 className="text-5xl font-bold tracking-[-2px] mb-3 text-[#1c2526]">
        Whoops — we couldn&apos;t find that crag.
      </h1>

      <p className="text-2xl text-[#5c6666] max-w-md mb-8">
        It might have moved, or maybe it&apos;s a secret local spot that hasn&apos;t been added yet.
      </p>

      <Link
        href="/"
        className="flex items-center gap-3 px-10 py-4 rounded-full bg-[#166534] text-white text-lg font-bold active:scale-[0.985] transition"
      >
        <Home className="w-5 h-5" />
        Take me back to the good stuff
      </Link>

      <p className="mt-8 text-sm text-[#78716c]">
        Pro tip: Use the big search bar or hit “Near Me” — that almost always works.
      </p>
    </div>
  );
}

import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Car, KeyRound, Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0DFC8] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        <Logo size="md" withTagline href="/" />

        <div className="flex items-center gap-3">
          <Link
            href="/cars"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#735340] hover:text-[#E8772E] px-3 py-2 rounded-xl transition-colors"
          >
            <Car className="w-4 h-4" />
            Browse Cars
          </Link>

          <Link
            href="/login"
            className="h-10 px-4 rounded-full bg-[#FAF0E4] hover:bg-[#F0DFC8] border border-[#F0DFC8] text-[#3B2216] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#E8772E]" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

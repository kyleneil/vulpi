import Link from 'next/link';
import { Mascot } from './Mascot';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withTagline?: boolean;
  href?: string;
  className?: string;
}

export function Logo({ size = 'md', withTagline = false, href = '/', className = '' }: LogoProps) {
  const textSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  const mascotSize: 'xs' | 'sm' | 'md' = {
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
  }[size];

  const inner = (
    <>
      <Mascot size={mascotSize} className="pointer-events-none" />
      <div className="flex flex-col justify-center pointer-events-none">
        <span className={`${textSize} font-black leading-tight tracking-tight flex items-center`}>
          Vulpi<span className="text-[#E8772E]">.</span>
        </span>
        {withTagline && (
          <span className="text-[9px] font-bold tracking-wider text-[#735340] uppercase -mt-0.5">
            Smart Rentals • CDO
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 font-bold tracking-tight text-[#3B2216] select-none hover:opacity-90 transition-opacity cursor-pointer ${className}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 font-bold tracking-tight text-[#3B2216] select-none ${className}`}>
      {inner}
    </div>
  );
}

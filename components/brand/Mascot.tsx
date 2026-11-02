import Image from 'next/image';

interface MascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

export function Mascot({ size = 'md', className = '', priority = false }: MascotProps) {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-16 h-16',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60',
  }[size];

  return (
    <div className={`relative shrink-0 overflow-hidden ${sizeClasses} ${className}`}>
      <Image
        src="/brand/vulpi-mascot.svg"
        alt="Vulpi the friendly fox mascot"
        fill
        sizes="(max-width: 768px) 100px, 200px"
        priority={priority}
        className="object-contain select-none drop-shadow-xs"
      />
    </div>
  );
}

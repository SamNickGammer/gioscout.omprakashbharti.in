import Image from 'next/image';
import { cn } from '@/lib/utils';

/** The GeoScout mark. `full` shows the wordmark, otherwise just the pin icon. */
export function Logo({
  full = false,
  className,
  size = 32,
}: {
  full?: boolean;
  className?: string;
  size?: number;
}) {
  if (full) {
    return (
      <Image
        src="/logofull.png"
        alt="GeoScout"
        width={size * 3.4}
        height={size}
        priority
        className={cn('h-auto w-auto', className)}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="GeoScout"
      width={size}
      height={size}
      priority
      className={cn('object-contain', className)}
    />
  );
}

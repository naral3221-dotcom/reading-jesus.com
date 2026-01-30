'use client';

import { cn } from '@/lib/utils';

interface ProfileStatItemProps {
  label: string;
  value: number;
  onClick?: () => void;
  className?: string;
}

export function ProfileStatItem({
  label,
  value,
  onClick,
  className,
}: ProfileStatItemProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'text-center flex-1',
        onClick && 'hover:opacity-70 transition-opacity',
        className
      )}
    >
      <p className="text-lg font-bold tabular-nums">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Component>
  );
}

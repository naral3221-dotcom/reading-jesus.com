'use client';

import { getStreakLevel } from '@/lib/streak';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * 스트릭(연속 읽기) 배지 컴포넌트
 * 연속 읽기 일수에 따라 다른 스타일로 표시
 */
export function StreakBadge({
  streak,
  size = 'md',
  showLabel = false,
  className,
}: StreakBadgeProps) {
  // 0일이면 표시하지 않음
  if (streak <= 0) return null;

  const { color, emoji } = getStreakLevel(streak);

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-base gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        sizeClasses[size],
        color,
        className
      )}
      title={`${streak}일 연속 읽기 중`}
    >
      <span>{emoji}</span>
      <span>{streak}일</span>
      {showLabel && streak >= 7 && (
        <span className="text-muted-foreground text-xs">연속</span>
      )}
    </span>
  );
}

interface StreakHeaderProps {
  streak: number;
  className?: string;
}

/**
 * 헤더용 스트릭 표시 컴포넌트
 * 더 눈에 띄는 스타일로 표시
 */
export function StreakHeader({ streak, className }: StreakHeaderProps) {
  if (streak <= 0) return null;

  const { color, label, emoji } = getStreakLevel(streak);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-muted/50 to-accent-warm/10 border border-border',
        className
      )}
    >
      <span className="text-lg">{emoji}</span>
      <span className={cn('font-bold', color)}>{streak}일</span>
      <span className="text-muted-foreground text-sm">연속 읽기 중!</span>
      {label && streak >= 7 && (
        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', color, 'bg-background/80')}>
          {label}
        </span>
      )}
    </div>
  );
}

'use client';

import { usePlatformStats } from '@/presentation/hooks/queries/usePlatformStats';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStatsProps {
  className?: string;
}

/**
 * 플랫폼 통계 표시 컴포넌트
 * - 지금까지 함께한 나눔 수 N개
 * - 오늘 N개의 묵상이 올라왔습니다
 */
export function PlatformStats({ className }: PlatformStatsProps) {
  const { data: stats, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className={cn('', className)}>
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    );
  }

  const totalCount = stats?.totalSharingCount || 0;
  const todayPosts = stats?.todayPostsCount || 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-accent-warm/5 to-transparent border border-primary/15 px-5 py-4',
        className
      )}
    >
      {/* 배경 장식 */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/8 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-accent-warm/8 blur-xl" />

      <div className="relative space-y-2 text-center">
        {/* 누적 나눔 수 */}
        <p className="text-sm text-muted-foreground">
          지금까지 함께한 나눔 수{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold">
            {totalCount.toLocaleString()}개
          </span>
        </p>

        {/* 오늘의 묵상 */}
        <p className="text-sm text-muted-foreground">
          오늘{' '}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-accent-warm/15 text-accent-warm font-bold">
            {todayPosts.toLocaleString()}개
          </span>
          의 묵상이 올라왔습니다
        </p>
      </div>
    </div>
  );
}

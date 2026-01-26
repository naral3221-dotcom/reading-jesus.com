'use client';

import { BookOpen, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useChurchReadingProgress } from '@/presentation/hooks/queries/useChurchStats';

interface ReadingProgressProps {
  churchCode: string;
  churchId?: string;
  userId?: string | null;
}

export function ReadingProgress({ churchId, userId }: ReadingProgressProps) {
  const { data: stats, isLoading } = useChurchReadingProgress(churchId, userId ?? null);

  const progressPercent = Math.round(((stats?.completedDays ?? 0) / (stats?.totalDays ?? 365)) * 100);
  const weeklyPercent = Math.round(((stats?.weeklyCompleted ?? 0) / (stats?.weeklyGoal ?? 7)) * 100);

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-4">
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-2 bg-muted/50 rounded" />
            <div className="h-3 bg-muted/50 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          읽기 진도
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 전체 진도 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">연간 진도</span>
            <span className="text-muted-foreground">
              {stats?.completedDays ?? 0}/{stats?.totalDays ?? 365}일 ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* 이번 주 목표 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium flex items-center gap-1">
              <Target className="w-3 h-3" />
              이번 주
            </span>
            <span className="text-muted-foreground">
              {stats?.weeklyCompleted ?? 0}/{stats?.weeklyGoal ?? 7}일
            </span>
          </div>
          <Progress value={weeklyPercent} className="h-2" />
        </div>

        {/* 연속 읽기 */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-accent" />
            연속 읽기
          </span>
          <span className="text-lg font-bold text-foreground">
            {stats?.currentStreak ?? 0}일
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MyPageStats } from '@/types';

interface StatsSectionProps {
  stats: MyPageStats;
  completedLabel?: string; // "완료한 날" 또는 "읽은 날"
}

export function StatsSection({
  stats,
  completedLabel = '완료한 날',
}: StatsSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* 완료한 날 */}
      <Card className="card-hover">
        <CardContent className="pt-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.completedDays}</p>
          <p className="text-xs text-muted-foreground">{completedLabel}</p>
        </CardContent>
      </Card>

      {/* 연속 일수 */}
      <Card
        className={cn(
          'card-hover',
          stats.currentStreak > 0 &&
            'border-accent bg-accent/10'
        )}
      >
        <CardContent className="pt-4 text-center">
          <div
            className={cn(
              'w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center',
              stats.currentStreak > 0
                ? 'bg-accent/20'
                : 'bg-muted'
            )}
          >
            <Flame
              className={cn(
                'w-5 h-5',
                stats.currentStreak > 0 ? 'text-accent-foreground' : 'text-muted-foreground'
              )}
            />
          </div>
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-xs text-muted-foreground">연속 일수</p>
        </CardContent>
      </Card>

      {/* 진행률 */}
      <Card className="card-hover">
        <CardContent className="pt-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-bold">{stats.progressPercentage}%</p>
          <p className="text-xs text-muted-foreground">진행률</p>
        </CardContent>
      </Card>
    </div>
  );
}

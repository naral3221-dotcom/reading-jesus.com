'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, PenLine, Flame } from 'lucide-react';

interface DashboardStatsProps {
  readChapters: number;
  writtenQTs: number;
  streakDays: number;
  progressPercent: number;
}

export function DashboardStats({
  readChapters,
  writtenQTs,
  streakDays,
  progressPercent,
}: DashboardStatsProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="pt-4 pb-4">
        {/* 진행률 바 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground font-medium">통독 진행률</span>
            <span className="font-bold text-foreground">{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary rounded-full h-2.5 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 읽은 성경 */}
          <div className="text-center p-3 bg-primary/5 rounded-xl">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground">{readChapters}</p>
            <p className="text-[10px] text-muted-foreground">읽은 장</p>
          </div>

          {/* 작성한 QT */}
          <div className="text-center p-3 bg-accent-cool/5 rounded-xl">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-accent-cool/10 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-accent-cool" />
            </div>
            <p className="text-lg font-bold text-foreground">{writtenQTs}</p>
            <p className="text-[10px] text-muted-foreground">작성한 QT</p>
          </div>

          {/* 연속 읽기 */}
          <div className="text-center p-3 bg-accent-warm/5 rounded-xl">
            <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-accent-warm/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-accent-warm" />
            </div>
            <p className="text-lg font-bold text-foreground">{streakDays}</p>
            <p className="text-[10px] text-muted-foreground">연속 읽기</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

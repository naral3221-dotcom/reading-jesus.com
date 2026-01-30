'use client';

import Link from 'next/link';
import { BookOpen, ChevronRight, Calendar, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeeklyReadingSchedule } from '@/presentation/hooks/queries/useReadingSchedule';
import { cn } from '@/lib/utils';
import { getTodayDateString } from '@/lib/date-utils';

interface BibleContentProps {
  churchCode: string;
}

export function BibleContent({ churchCode }: BibleContentProps) {
  const { data, isLoading } = useWeeklyReadingSchedule();
  const schedules = data?.schedules ?? [];
  const todaySchedule = data?.todaySchedule ?? null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const isToday = (dateStr: string) => {
    return dateStr === getTodayDateString();
  };

  const isPast = (dateStr: string) => {
    return dateStr < getTodayDateString();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-muted/30">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-muted/50 via-background to-muted/30 sticky top-0 z-10 border-b border-border/60">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">성경 읽기</h1>
              <p className="text-xs text-muted-foreground">통독 일정</p>
            </div>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-4 space-y-4">
        {/* 오늘의 말씀 */}
        {todaySchedule && (
          <Card className="border-border bg-gradient-to-r from-muted/50 to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                오늘의 말씀
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground mb-2">
                {todaySchedule.reading}
              </p>
              {todaySchedule.memory_verse && (
                <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                  암송: {todaySchedule.memory_verse}
                </p>
              )}
              <Button asChild className="w-full mt-4">
                <Link href={`/church/${churchCode}/bible/reader`}>
                  성경 읽기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 이번 주 일정 */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">이번 주 일정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.date}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  isToday(schedule.date) && 'bg-accent/10 border border-accent/30',
                  isPast(schedule.date) && !isToday(schedule.date) && 'bg-muted/50',
                  !isPast(schedule.date) && !isToday(schedule.date) && 'bg-background border border-border/60'
                )}
              >
                <div className="flex items-center gap-3">
                  {isPast(schedule.date) && !isToday(schedule.date) && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  {isToday(schedule.date) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">!</span>
                    </div>
                  )}
                  <div>
                    <p className={cn(
                      'text-sm font-medium',
                      isToday(schedule.date) ? 'text-foreground' : 'text-foreground'
                    )}>
                      {formatDate(schedule.date)}
                    </p>
                    <p className={cn(
                      'text-xs',
                      isToday(schedule.date) ? 'text-muted-foreground' : 'text-muted-foreground'
                    )}>
                      {schedule.reading}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

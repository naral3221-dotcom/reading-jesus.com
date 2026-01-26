'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompletedReadingDays } from '@/presentation/hooks/queries/useChurchStats';
import { cn } from '@/lib/utils';
import readingPlan from '@/data/reading_plan.json';

interface ReadingCalendarProps {
  churchCode: string;
  churchId?: string;
  userId?: string | null;
}

interface ReadingDay {
  day: number;
  date: string;
  book: string;
  reading: string;
}

export function ReadingCalendar({ churchId, userId }: ReadingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: completedDays = new Set<number>() } = useCompletedReadingDays(churchId, userId ?? null);

  // reading_plan.json에서 날짜별 일정 맵 생성
  const scheduleMap = useMemo(() => {
    const map = new Map<string, ReadingDay>();
    (readingPlan as ReadingDay[]).forEach(item => {
      map.set(item.date, item);
    });
    return map;
  }, []);

  // 날짜로 day_number 찾기
  const getDayNumberByDate = (dateStr: string): number | null => {
    const schedule = scheduleMap.get(dateStr);
    return schedule?.day || null;
  };

  // 월의 첫 날과 마지막 날 계산
  const { days } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    // 시작 요일 (0: 일요일)
    const startDayOfWeek = first.getDay();

    // 날짜 배열 생성
    const daysArray: (number | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }

    // 현재 달의 날짜
    for (let day = 1; day <= last.getDate(); day++) {
      daysArray.push(day);
    }

    return {
      days: daysArray,
    };
  }, [currentMonth]);

  // 날짜에 해당하는 일정 찾기
  const getScheduleForDay = (day: number | null): ReadingDay | undefined => {
    if (!day) return undefined;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduleMap.get(dateStr);
  };

  // 해당 날짜가 완료되었는지 확인
  const isCompleted = (day: number | null): boolean => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayNumber = getDayNumberByDate(dateStr);
    if (!dayNumber) return false;
    return completedDays.has(dayNumber);
  };

  // 오늘 날짜 확인
  const isToday = (day: number | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  // 지난 날짜 확인 (미완료 표시용)
  const isPast = (day: number | null): boolean => {
    if (!day) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            읽기 캘린더
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[80px] text-center">
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                'text-[10px] font-medium text-center py-1',
                index === 0 && 'text-foreground/70',
                index === 6 && 'text-foreground/70',
                index > 0 && index < 6 && 'text-muted-foreground'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const schedule = getScheduleForDay(day);
            const hasSchedule = !!schedule;
            const completed = isCompleted(day);
            const past = isPast(day);
            const today = isToday(day);

            return (
              <div
                key={index}
                className={cn(
                  'aspect-square flex flex-col items-center justify-center rounded-md text-xs relative',
                  !day && 'invisible',
                  today && 'bg-primary text-primary-foreground font-bold',
                  !today && completed && 'bg-accent/20 text-foreground font-medium',
                  !today && !completed && hasSchedule && past && 'bg-muted/30 text-muted-foreground',
                  !today && !completed && hasSchedule && !past && 'bg-muted/50 text-foreground',
                  !today && !hasSchedule && 'text-muted-foreground/50'
                )}
                title={schedule?.reading}
              >
                {day}
                {completed && !today && (
                  <Check className="w-2.5 h-2.5 text-accent absolute bottom-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>오늘</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-3 h-3 rounded bg-accent/20 flex items-center justify-center">
              <Check className="w-2 h-2 text-accent" />
            </div>
            <span>완료</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="w-3 h-3 rounded bg-muted/50" />
            <span>예정</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

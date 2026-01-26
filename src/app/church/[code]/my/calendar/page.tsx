'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Calendar } from 'lucide-react';
import { ChurchBottomNav } from '@/components/church/ChurchBottomNav';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  differenceInDays,
  isAfter,
} from 'date-fns';
import { ko } from 'date-fns/locale';

export default function ChurchCalendarPage() {
  const router = useRouter();
  const params = useParams();
  const churchCode = params.code as string;

  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkedDates, setCheckedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [churchData, setChurchData] = useState<{ id: string; name: string; schedule_start_date: string | null } | null>(null);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const initUser = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }

    // 교회 정보 조회
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, schedule_start_date')
      .eq('code', churchCode)
      .single();

    if (church) {
      setChurchData(church);
    } else {
      setLoading(false);
    }
  }, [churchCode]);

  const loadCheckedDates = useCallback(async () => {
    if (!churchData || !userId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    try {
      const { data: checks } = await supabase
        .from('church_reading_checks')
        .select('day_number')
        .eq('user_id', userId)
        .eq('church_id', churchData.id);

      if (checks && churchData.schedule_start_date) {
        const startDate = new Date(churchData.schedule_start_date);
        const dates = new Set<string>();

        checks.forEach(check => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + check.day_number - 1);
          dates.add(format(date, 'yyyy-MM-dd'));
        });

        setCheckedDates(dates);
      }
    } catch (error) {
      console.error('Error loading checked dates:', error);
    } finally {
      setLoading(false);
    }
  }, [churchData, userId]);

  useEffect(() => {
    initUser();
  }, [initUser]);

  useEffect(() => {
    if (churchData && userId) {
      loadCheckedDates();
    }
  }, [churchData, userId, loadCheckedDates]);

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getStartPadding = () => {
    const firstDay = startOfMonth(currentMonth);
    return getDay(firstDay);
  };

  const goToPrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isChecked = (date: Date) => {
    return checkedDates.has(format(date, 'yyyy-MM-dd'));
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isFuture = (date: Date) => {
    return isAfter(date, new Date());
  };

  const getDayNumber = (date: Date) => {
    if (!churchData?.schedule_start_date) return null;
    const startDate = new Date(churchData.schedule_start_date);
    const diff = differenceInDays(date, startDate) + 1;
    if (diff >= 1 && diff <= 365) return diff;
    return null;
  };

  // 이번 달 통계
  const monthStats = () => {
    const days = getDaysInMonth();
    let checked = 0;
    let total = 0;

    days.forEach(day => {
      const dayNum = getDayNumber(day);
      if (dayNum !== null && !isFuture(day)) {
        total++;
        if (isChecked(day)) checked++;
      }
    });

    return { checked, total };
  };

  // 전체 통계
  const totalStats = () => {
    return {
      checked: checkedDates.size,
      total: 365,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded animate-pulse" />
            <div className="h-7 w-28 bg-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <CalendarSkeleton />
        </main>
      </div>
    );
  }

  const stats = monthStats();
  const total = totalStats();

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/church/${churchCode}/my`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">통독 캘린더</h1>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            오늘
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Month Navigation */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'yyyy년 M월', { locale: ko })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "text-center text-sm font-medium py-2",
                    index === 0 && "text-red-500",
                    index === 6 && "text-accent"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for padding */}
              {Array.from({ length: getStartPadding() }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days */}
              {getDaysInMonth().map((day) => {
                const checked = isChecked(day);
                const today = isToday(day);
                const future = isFuture(day);
                const dayNum = getDayNumber(day);
                const dayOfWeek = getDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative transition-colors",
                      today && "ring-2 ring-primary ring-offset-1",
                      checked && "bg-accent/10 dark:bg-accent/50",
                      future && "opacity-40",
                      isSelected && "bg-primary/20",
                      !checked && !future && dayNum && "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      dayOfWeek === 0 && "text-red-500",
                      dayOfWeek === 6 && "text-accent",
                      checked && "font-bold text-accent dark:text-accent-foreground",
                      today && !checked && "font-bold"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex gap-0.5 absolute bottom-0.5">
                      {checked && (
                        <CheckCircle2 className="w-3 h-3 text-accent" />
                      )}
                    </div>
                    {dayNum && !checked && !future && (
                      <span className="text-[10px] text-muted-foreground">
                        D{dayNum}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 선택된 날짜 정보 */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{format(selectedDate, 'M월 d일 (E)', { locale: ko })}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                >
                  닫기
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* 통독 상태 */}
              {getDayNumber(selectedDate) && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isChecked(selectedDate) ? "bg-accent/10 dark:bg-accent/50" : "bg-muted"
                  )}>
                    <CheckCircle2 className={cn(
                      "w-5 h-5",
                      isChecked(selectedDate) ? "text-accent" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">Day {getDayNumber(selectedDate)} 통독</p>
                    <p className="text-sm text-muted-foreground">
                      {isChecked(selectedDate) ? '완료' : isFuture(selectedDate) ? '예정' : '미완료'}
                    </p>
                  </div>
                </div>
              )}

              {/* 일정 없음 */}
              {!getDayNumber(selectedDate) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  이 날에는 일정이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly Stats */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-medium">이번 달 현황</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold">
                  {stats.checked}
                  <span className="text-base font-normal text-muted-foreground"> / {stats.total}일</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">달성률</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stats.total > 0 && stats.checked === stats.total ? "text-accent" : "text-primary"
                )}>
                  {stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full progress-animate"
                style={{
                  width: `${stats.total > 0 ? (stats.checked / stats.total) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Stats */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">전체 진행률</p>
                <p className="text-lg">
                  <span className="font-bold">{total.checked}</span>
                  <span className="text-muted-foreground"> / {total.total}일 완료</span>
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {Math.round((total.checked / total.total) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent/10 dark:bg-accent/50 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-accent" />
            </div>
            <span>읽음</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-primary ring-offset-1" />
            <span>오늘</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted opacity-40" />
            <span>미래</span>
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <ChurchBottomNav churchCode={churchCode} />
    </div>
  );
}

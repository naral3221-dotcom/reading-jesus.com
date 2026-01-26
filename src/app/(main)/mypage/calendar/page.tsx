'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarSkeleton } from '@/components/ui/skeleton';
import { NoGroupsEmpty } from '@/components/ui/empty-state';
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Calendar, Users, MapPin, Video } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { HelpButton } from '@/components/HelpButton';
import { helpContent } from '@/data/helpContent';
import type { GroupMeeting } from '@/types/meeting';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useCheckedDayNumbers } from '@/presentation/hooks/queries/useReadingCheck';

export default function CalendarPage() {
  const router = useRouter();
  const { activeGroup, loading: groupLoading } = useGroupCompat();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // ReadingCheck 훅 - 컨텍스트 설정
  const readingCheckContext = useMemo(() => ({
    groupId: activeGroup?.id ?? undefined,
  }), [activeGroup?.id]);

  const { data: checkedDayNumbers, isLoading: checksLoading } = useCheckedDayNumbers(userId, readingCheckContext);

  // day_number를 날짜로 변환하여 Set으로 관리
  const checkedDates = useMemo(() => {
    if (!activeGroup?.start_date || !checkedDayNumbers) return new Set<string>();

    const startDate = new Date(activeGroup.start_date);
    const dates = new Set<string>();

    checkedDayNumbers.forEach(dayNumber => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayNumber - 1);
      dates.add(format(date, 'yyyy-MM-dd'));
    });

    return dates;
  }, [activeGroup?.start_date, checkedDayNumbers]);

  const loadMeetings = useCallback(async () => {
    if (!activeGroup) return;

    try {
      const supabase = getSupabaseBrowserClient();
      // 현재 월의 시작과 끝
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data } = await supabase
        .from('group_meetings')
        .select('*')
        .eq('group_id', activeGroup.id)
        .gte('meeting_date', format(start, 'yyyy-MM-dd'))
        .lte('meeting_date', format(end, 'yyyy-MM-dd'))
        .neq('status', 'cancelled')
        .order('meeting_date', { ascending: true });

      if (data) {
        setMeetings(data as GroupMeeting[]);
      }
    } catch {
      // 테이블이 없는 경우 무시
      setMeetings([]);
    }
  }, [activeGroup, currentMonth]);

  // 모임 로드
  useEffect(() => {
    if (activeGroup) {
      loadMeetings();
    }
  }, [activeGroup, currentMonth, loadMeetings]);

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
    if (!activeGroup?.start_date) return null;
    const startDate = new Date(activeGroup.start_date);
    const diff = differenceInDays(date, startDate) + 1;
    if (diff >= 1 && diff <= 365) return diff;
    return null;
  };

  // 해당 날짜에 모임이 있는지 확인
  const getMeetingsOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return meetings.filter(m => m.meeting_date.startsWith(dateStr));
  };

  const hasMeeting = (date: Date) => {
    return getMeetingsOnDate(date).length > 0;
  };

  // 선택된 날짜의 일정 가져오기 (추후 확장용)
  const _getSelectedDateInfo = () => {
    if (!selectedDate) return null;
    const dateMeetings = getMeetingsOnDate(selectedDate);
    const dayNum = getDayNumber(selectedDate);
    const checked = isChecked(selectedDate);
    return { meetings: dateMeetings, dayNumber: dayNum, isChecked: checked };
  };
  void _getSelectedDateInfo;

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

  const isLoading = userLoading || groupLoading || checksLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
        </div>
        <CalendarSkeleton />
      </div>
    );
  }

  const stats = monthStats();
  const total = totalStats();

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">통독 캘린더</h1>
        </div>
        <div className="flex gap-2 items-center">
          <HelpButton helpContent={helpContent.calendar} />
          {activeGroup && (
            <Button variant="outline" size="sm" onClick={goToToday}>
              오늘
            </Button>
          )}
        </div>
      </div>

      {!activeGroup ? (
        <NoGroupsEmpty onCreate={() => router.push('/group')} />
      ) : (
        <>
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
                  const meetingOnDay = hasMeeting(day);
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
                        !checked && !future && (dayNum || meetingOnDay) && "hover:bg-muted/50"
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
                        {meetingOnDay && (
                          <Users className="w-3 h-3 text-accent" />
                        )}
                      </div>
                      {dayNum && !checked && !future && !meetingOnDay && (
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

          {/* 선택된 날짜 일정 */}
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

                {/* 모임 일정 */}
                {getMeetingsOnDate(selectedDate).map((meeting) => (
                  <Link
                    key={meeting.id}
                    href={`/group/${meeting.group_id}/meetings`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 bg-accent/10 dark:bg-accent/20 rounded-lg hover:bg-accent/10 dark:hover:bg-accent/50 transition-colors">
                      <div className="p-2 bg-accent/10 dark:bg-accent/50 rounded-lg">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{meeting.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {meeting.is_online ? (
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3" />
                              온라인
                            </span>
                          ) : meeting.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {meeting.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* 일정 없음 */}
                {!getDayNumber(selectedDate) && getMeetingsOnDate(selectedDate).length === 0 && (
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
              <div className="w-4 h-4 rounded flex items-center justify-center bg-accent/10 dark:bg-accent/20">
                <Users className="w-2.5 h-2.5 text-accent" />
              </div>
              <span>모임</span>
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
        </>
      )}
    </div>
  );
}

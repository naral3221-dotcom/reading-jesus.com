'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import readingPlan from '@/data/reading_plan.json';
import { CheckCircle2, Loader2, BookOpen, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { HelpButton } from '@/components/HelpButton';
import { helpContent } from '@/data/helpContent';
import { useToast } from '@/components/ui/toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { PlanSelector } from '@/components/bible/PlanSelector';
import { READING_JESUS_2026_PLAN_ID } from '@/types';
import { useCurrentUser } from '@/presentation/hooks/queries';
import { useReadingCheckWithToggle } from '@/presentation/hooks/queries/useReadingCheck';

// 성경 66권 목록
const oldTestament = [
  '창세기', '출애굽기', '레위기', '민수기', '신명기',
  '여호수아', '사사기', '룻기', '사무엘상', '사무엘하',
  '열왕기상', '열왕기하', '역대상', '역대하', '에스라',
  '느헤미야', '에스더', '욥기', '시편', '잠언',
  '전도서', '아가', '이사야', '예레미야', '예레미야애가',
  '에스겔', '다니엘', '호세아', '요엘', '아모스',
  '오바댜', '요나', '미가', '나훔', '하박국',
  '스바냐', '학개', '스가랴', '말라기'
];

const newTestament = [
  '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
  '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서',
  '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서',
  '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서',
  '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서',
  '유다서', '요한계시록'
];

export default function BiblePage() {
  const { activeGroup, loading: groupLoading } = useGroupCompat();
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // React Query 훅으로 읽음 체크 관리
  const {
    checkedDays,
    isChecked,
    toggle,
    isLoading,
    isToggling,
  } = useReadingCheckWithToggle(userId, { groupId: activeGroup?.id ?? null });

  // 플랜 선택 관련 state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(READING_JESUS_2026_PLAN_ID);

  // Long press 관련 state
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  // 일정 필터링 state
  const [showAllSchedule, setShowAllSchedule] = useState(false);

  // 오늘 Day 계산 (그룹 시작일 기준)
  const todayDay = useMemo(() => {
    if (!activeGroup?.start_date) return 1;
    const startDate = parseISO(activeGroup.start_date);
    const today = new Date();
    const daysDiff = differenceInDays(today, startDate) + 1;
    // 1~365 사이로 제한
    return Math.max(1, Math.min(365, daysDiff));
  }, [activeGroup?.start_date]);

  // 필터링된 일정 (오늘 전후 3일)
  const filteredPlan = useMemo(() => {
    if (showAllSchedule) return readingPlan;
    return readingPlan.filter(plan => {
      const diff = plan.day - todayDay;
      return diff >= -3 && diff <= 3;
    });
  }, [showAllSchedule, todayDay]);

  // Long press handlers
  const handleLongPressStart = useCallback((dayNumber: number) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setSelectedDay(dayNumber);
      setShowCheckDialog(true);
    }, 500); // 500ms long press
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleConfirmCheck = async () => {
    if (!userId || !activeGroup || selectedDay === null) return;

    const wasChecked = isChecked(selectedDay);
    const plan = readingPlan.find(p => p.day === selectedDay);

    try {
      await toggle(selectedDay);

      if (wasChecked) {
        toast({
          title: '읽음 완료가 해제되었습니다',
          description: `Day ${selectedDay} - ${plan?.book}`,
        });
      } else {
        toast({
          title: '읽음 완료 처리되었습니다',
          description: `${format(new Date(), 'yyyy년 M월 d일 HH:mm', { locale: ko })} 기준`,
        });
      }
    } catch {
      toast({
        title: '오류가 발생했습니다',
        description: '다시 시도해주세요',
        variant: 'error',
      });
    }

    setShowCheckDialog(false);
    setSelectedDay(null);
  };

  // 통독 일정에서 책별로 그룹화 (합쳐진 책들도 개별로 분리)
  const bookDays = readingPlan.reduce((acc, plan) => {
    // 책 이름에 쉼표가 있으면 분리해서 각각에 추가
    const books = plan.book.split(',').map(b => b.trim());
    books.forEach(bookName => {
      if (!acc[bookName]) {
        acc[bookName] = [];
      }
      acc[bookName].push(plan);
    });
    return acc;
  }, {} as Record<string, typeof readingPlan>);

  // 책별 완료 상태 계산
  const getBookProgress = (book: string) => {
    const days = bookDays[book] || [];
    if (days.length === 0) return { completed: 0, total: 0 };
    const completed = days.filter(d => isChecked(d.day)).length;
    return { completed, total: days.length };
  };

  const renderBookList = (books: string[]) => (
    <div className="grid grid-cols-3 gap-2">
      {books.map((book) => {
        const days = bookDays[book] || [];
        const hasReadings = days.length > 0;
        const { completed, total } = getBookProgress(book);
        const isComplete = completed === total && total > 0;

        return (
          <Link key={book} href={`/bible-reader?book=${encodeURIComponent(book)}&chapter=1`}>
            <Card
              className={`cursor-pointer transition-colors ${
                hasReadings ? 'hover:bg-accent' : 'opacity-50'
              } ${isComplete ? 'border-accent bg-accent/10 dark:bg-accent/20' : ''}`}
            >
              <CardContent className="p-3 text-center">
                <p className="text-sm font-medium truncate">{book}</p>
                {hasReadings && (
                  <p className={`text-xs mt-1 ${isComplete ? 'text-accent' : 'text-muted-foreground'}`}>
                    {completed}/{total}일
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );

  if (isLoading || groupLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 플랜 변경 핸들러
  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    // TODO: 커스텀 플랜 선택 시 해당 플랜 데이터 로드
  };

  return (
    <div className="flex flex-col p-4">
      {/* Header */}
      <div className="py-4 relative">
        <h1 className="text-xl font-bold">성경 전체 보기</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeGroup ? `완료: ${checkedDays.size}/365일` : '그룹에 가입하면 진행 상황을 볼 수 있어요'}
        </p>
        <HelpButton
          helpContent={helpContent.bible}
          className="absolute top-4 right-0"
        />
      </div>

      {/* 플랜 선택기 */}
      {userId && (
        <div className="mb-4">
          <PlanSelector
            selectedPlanId={selectedPlanId}
            onPlanChange={(planId) => handlePlanChange(planId)}
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">통독 일정</TabsTrigger>
          <TabsTrigger value="old">구약</TabsTrigger>
          <TabsTrigger value="new">신약</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <div className="mb-3 space-y-2">
            {/* 오늘 Day 표시 */}
            {activeGroup && (
              <div className="text-center bg-primary/10 rounded-lg py-2">
                <span className="text-sm font-medium text-primary">
                  오늘은 Day {todayDay}입니다
                </span>
              </div>
            )}

            {/* 안내 문구 */}
            <p className="text-xs text-muted-foreground text-center">
              💡 일정을 길게 누르면 읽음 완료를 체크할 수 있어요
            </p>

            {/* 전체 보기 토글 */}
            {!showAllSchedule && (
              <p className="text-xs text-center text-muted-foreground">
                오늘 기준 ±3일 일정만 표시 중
              </p>
            )}
          </div>

          <div className="space-y-2">
            {filteredPlan.map((plan) => {
              const dayIsChecked = isChecked(plan.day);
              const checkedAt = checkedDays.get(plan.day);
              const isToday = plan.day === todayDay;
              // range에서 첫 번째 장 번호 추출 (예: "1-4" -> 1)
              const firstChapter = plan.range.split('-')[0];

              return (
                <Card
                  key={plan.day}
                  className={`transition-colors select-none ${
                    dayIsChecked
                      ? 'border-accent bg-accent/10 dark:bg-accent/20'
                      : isToday
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : ''
                  }`}
                  onMouseDown={() => activeGroup && handleLongPressStart(plan.day)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={() => activeGroup && handleLongPressStart(plan.day)}
                  onTouchEnd={handleLongPressEnd}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* 체크 표시 또는 Day 번호 */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          dayIsChecked
                            ? 'bg-accent text-white'
                            : isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10'
                        } ${!activeGroup && 'opacity-50'}`}
                      >
                        {dayIsChecked ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{plan.day}</span>
                        )}
                      </div>
                      {/* 성경 읽기 링크 */}
                      <Link
                        href={`/bible-reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}
                        className="flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{plan.book}</p>
                          {isToday && (
                            <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                              오늘
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {plan.reading}
                        </p>
                        {dayIsChecked && checkedAt && (
                          <p className="text-xs text-accent mt-0.5">
                            ✓ {format(new Date(checkedAt), 'M월 d일 HH:mm', { locale: ko })} 완료
                          </p>
                        )}
                      </Link>
                    </div>
                    {/* QT 보기 버튼 */}
                    <Link href={`/qt/${plan.day}`}>
                      <button
                        type="button"
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                        title="QT 보기"
                      >
                        <MessageCircle className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </Link>
                    {/* 성경 읽기 버튼 */}
                    <Link href={`/bible-reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}>
                      <button
                        type="button"
                        className="p-2 hover:bg-accent rounded-md transition-colors"
                        title="성경 읽기"
                      >
                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 전체 보기 / 접기 버튼 */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllSchedule(!showAllSchedule)}
              className="gap-2"
            >
              {showAllSchedule ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  이번 주만 보기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  전체 일정 보기 (365일)
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="old" className="mt-4">
          {renderBookList(oldTestament)}
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          {renderBookList(newTestament)}
        </TabsContent>
      </Tabs>

      {/* 읽음 완료 확인 다이얼로그 */}
      <AlertDialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedDay && isChecked(selectedDay)
                ? '읽음 완료를 해제하시겠습니까?'
                : '읽음 완료 처리하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDay && (() => {
                const plan = readingPlan.find(p => p.day === selectedDay);
                const dayIsChecked = isChecked(selectedDay);
                return dayIsChecked
                  ? `Day ${selectedDay} - ${plan?.book}의 읽음 완료 표시가 해제됩니다.`
                  : `Day ${selectedDay} - ${plan?.book}을(를) 읽음 완료로 표시합니다. 완료 시간이 기록됩니다.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheck} disabled={isToggling}>
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedDay && isChecked(selectedDay) ? (
                '해제하기'
              ) : (
                '완료하기'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

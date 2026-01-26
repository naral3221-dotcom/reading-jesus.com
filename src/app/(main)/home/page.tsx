'use client';

import { Button } from '@/components/ui/button';
import { HomeSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
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
import { ChevronLeft, ChevronRight, BookOpen, Check, MessageCircle, PenLine, Loader2 } from 'lucide-react';
import readingPlan from '@/data/reading_plan.json';
import { useState, useEffect, useMemo, useRef } from 'react';
import { differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { useToast } from '@/components/ui/toast';
import { NoGroupHome } from '@/components/home/NoGroupHome';
import { PersonalHomeCard } from '@/components/home/PersonalHomeCard';
import type { ReadingPlan, ScheduleMode } from '@/types';
import { useUpdateProfile } from '@/presentation/hooks/queries/useUser';
import { useReadingCheckWithToggle } from '@/presentation/hooks/queries/useReadingCheck';
import { useUserProjects } from '@/presentation/hooks/queries/usePersonalProject';
import { useMainData } from '@/contexts/MainDataContext';
import { UnifiedFeedCard, type UnifiedFeedItem, type FeedSource } from '@/components/feed/UnifiedFeedCard';
import { FeedTabs, FeedEmptyState, type FeedTabType } from '@/components/feed/FeedTabs';
import { FeedDetailModal } from '@/components/feed/FeedDetailModal';
import { useUnifiedFeedInfinite } from '@/presentation/hooks/queries/useUnifiedFeed';
import { useRouter } from 'next/navigation';

// 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Day 번호로 일정 찾기
const findPlanByDay = (day: number): ReadingPlan | undefined => {
  return (readingPlan as ReadingPlan[]).find(p => p.day === day);
};

// 오늘 날짜에 가장 가까운 일정 찾기 (오늘 또는 그 이전의 가장 최근 일정)
const findClosestPlan = (dateStr: string): ReadingPlan | undefined => {
  const plans = readingPlan as ReadingPlan[];
  // 정확히 오늘 날짜의 일정이 있으면 반환
  const exactMatch = plans.find(p => p.date === dateStr);
  if (exactMatch) return exactMatch;

  // 없으면 오늘 이전의 가장 최근 일정 찾기
  const pastPlans = plans.filter(p => p.date <= dateStr);
  if (pastPlans.length > 0) {
    return pastPlans[pastPlans.length - 1];
  }

  // 그것도 없으면 미래의 첫 일정
  const futurePlans = plans.filter(p => p.date > dateStr);
  return futurePlans[0];
};

export default function HomePage() {
  const router = useRouter();

  // Context에서 데이터 가져오기
  const {
    user,
    church,
    activeGroup,
    isLoading: contextLoading,
    error: contextError,
  } = useMainData();

  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<ReadingPlan | null>(null);
  const [todayPlan, setTodayPlan] = useState<ReadingPlan | null>(null);
  const [checkAnimation, setCheckAnimation] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('calendar');

  // 피드 관련 상태
  const [activeTab, setActiveTab] = useState<FeedTabType>('all');
  const [selectedItem, setSelectedItem] = useState<UnifiedFeedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const totalDays = readingPlan.length;
  const userId = user?.id ?? null;

  // 프로필 업데이트 뮤테이션
  const updateProfile = useUpdateProfile();

  // 개인 프로젝트 조회 (그룹이 없을 때 사용)
  const { data: personalProjects = [], isLoading: projectsLoading, refetch: refetchProjects } = useUserProjects(userId, true);

  // ReadingCheck 훅 - 컨텍스트 설정
  const readingCheckContext = useMemo(() => ({
    groupId: activeGroup?.id ?? undefined,
  }), [activeGroup?.id]);

  const {
    checkedDays,
    toggle: toggleReadingCheck,
    isLoading: checksLoading,
  } = useReadingCheckWithToggle(userId, readingCheckContext);

  // 통합 피드 조회
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUnifiedFeedInfinite({ tab: activeTab });

  // 무한 스크롤 감지
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 현재 선택된 Day의 체크 상태
  const isRead = currentPlan ? checkedDays.has(currentPlan.day) : false;
  const checkedAt = currentPlan ? checkedDays.get(currentPlan.day) ?? null : null;

  // 온보딩 체크
  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = async () => {
    if (!userId) return;

    try {
      await updateProfile.mutateAsync({
        userId,
        hasCompletedOnboarding: true,
      });
      setShowOnboarding(false);
    } catch {
      console.error('온보딩 완료 저장 실패');
    }
  };

  // 초기 플랜 설정
  useEffect(() => {
    if (!activeGroup) {
      // 그룹이 없어도 오늘의 플랜은 설정
      const todayStr = getTodayDateString();
      const plan = findClosestPlan(todayStr);
      if (plan) {
        setCurrentPlan(plan);
        setTodayPlan(plan);
      }
      return;
    }

    const mode = (activeGroup.scheduleMode || 'calendar') as ScheduleMode;
    setScheduleMode(mode);

    let plan: ReadingPlan | undefined;

    if (mode === 'calendar') {
      const todayStr = getTodayDateString();
      plan = findClosestPlan(todayStr);
    } else {
      const startDate = new Date(activeGroup.startDate);
      const today = new Date();
      const dayIndex = differenceInDays(today, startDate) + 1;
      const clampedDay = Math.max(1, Math.min(dayIndex, totalDays));
      plan = findPlanByDay(clampedDay);
    }

    if (plan) {
      setCurrentPlan(plan);
      setTodayPlan(plan);
    }
  }, [activeGroup, totalDays]);

  const goToPrevDay = () => {
    if (!currentPlan || currentPlan.day <= 1) return;
    const prevPlan = findPlanByDay(currentPlan.day - 1);
    if (prevPlan) setCurrentPlan(prevPlan);
  };

  const goToNextDay = () => {
    if (!currentPlan || currentPlan.day >= totalDays) return;
    const nextPlan = findPlanByDay(currentPlan.day + 1);
    if (nextPlan) setCurrentPlan(nextPlan);
  };

  const handleCheckClick = () => {
    if (!userId || !activeGroup) return;
    setShowCheckDialog(true);
  };

  const handleConfirmCheck = async () => {
    if (!userId || !activeGroup || !currentPlan) return;

    const willBeRead = !isRead;

    if (willBeRead) {
      setCheckAnimation(true);
      setTimeout(() => setCheckAnimation(false), 600);
    }

    try {
      await toggleReadingCheck(currentPlan.day);

      const now = new Date();
      toast({
        title: willBeRead ? '읽음 완료 처리되었습니다' : '읽음 완료가 해제되었습니다',
        description: willBeRead
          ? `${format(now, 'yyyy년 M월 d일 HH:mm', { locale: ko })} 기준`
          : undefined,
      });
    } catch {
      toast({
        title: '오류가 발생했습니다',
        description: '다시 시도해주세요',
        variant: 'error',
      });
    }

    setShowCheckDialog(false);
  };

  // 피드 핸들러
  const handleLike = () => {
    // 낙관적 업데이트는 카드 내부에서 처리
  };

  const handleComment = (id: string, source: FeedSource) => {
    const items = feedData?.pages.flatMap((page) => page.items) ?? [];
    const item = items.find((i) => i.id === id && i.source === source);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const handleSourceClick = (source: FeedSource, sourceId?: string) => {
    if (!sourceId) return;
    if (source === 'group') {
      router.push(`/group/${sourceId}`);
    } else if (source === 'church') {
      router.push(`/church/${sourceId}`);
    }
  };

  const handleChurchClick = (churchCode: string) => {
    router.push(`/church/${churchCode}`);
  };

  const handleAuthorClick = (authorId: string) => {
    router.push(`/profile/${authorId}`);
  };

  const handleViewDetail = (item: UnifiedFeedItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const feedItems = feedData?.pages.flatMap((page) => page.items) ?? [];

  const isLoading = contextLoading || checksLoading || projectsLoading;

  if (isLoading) {
    return <HomeSkeleton />;
  }

  if (contextError && !user) {
    return (
      <div className="max-w-2xl mx-auto w-full p-4">
        <ErrorState
          message="사용자 정보를 불러올 수 없습니다."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // 그룹이 없는 경우
  if (!activeGroup) {
    if (personalProjects.length > 0 && userId) {
      const activeProject = personalProjects[0];
      return (
        <div className="max-w-2xl mx-auto w-full p-4 space-y-4">
          <PersonalHomeCard project={activeProject} userId={userId} />
          <OnboardingTutorial open={showOnboarding} onComplete={handleOnboardingComplete} />
        </div>
      );
    }

    if (userId) {
      return (
        <div className="max-w-2xl mx-auto w-full">
          <NoGroupHome userId={userId} onProjectCreated={() => refetchProjects()} />
          <OnboardingTutorial open={showOnboarding} onComplete={handleOnboardingComplete} />
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto w-full p-4 space-y-4">
        <div className="text-center py-4">
          <h1 className="text-2xl font-bold">리딩지저스</h1>
          <p className="text-muted-foreground text-sm mt-1">365일 성경 통독</p>
        </div>
        <Link href="/login">
          <Button className="w-full">로그인</Button>
        </Link>
      </div>
    );
  }

  const isToday = currentPlan?.day === todayPlan?.day;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero 섹션 - 오늘의 말씀 강조 */}
      {currentPlan && (
        <div className="sticky top-12 lg:top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
            {/* Day 네비게이션 */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevDay}
                disabled={currentPlan.day <= 1}
                className="h-11 w-11 shrink-0 hover:bg-muted"
                aria-label="이전 날"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              {/* Day 번호 및 오늘 배지 - 타이포그래피 강화 */}
              <div className="flex-1 min-w-0 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                    Day {currentPlan.day}
                  </h1>
                  {isToday && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                      오늘
                    </span>
                  )}
                </div>
                <p className="text-base lg:text-lg text-muted-foreground font-medium">
                  {currentPlan.reading}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                disabled={currentPlan.day >= totalDays}
                className="h-11 w-11 shrink-0 hover:bg-muted"
                aria-label="다음 날"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* CTA 버튼들 - 명확한 우선순위 */}
            <div className="flex items-center gap-3">
              {/* Primary CTA - 읽기 시작 */}
              <Link href={`/bible-reader?book=${currentPlan.book.split(' ')[0]}&chapter=1`} className="flex-[2]">
                <Button size="lg" className="w-full h-12 text-sm font-semibold">
                  <BookOpen className="w-4 h-4 mr-2" />
                  읽기 시작
                </Button>
              </Link>
              
              {/* Secondary CTA - QT */}
              <Link href={`/qt/${currentPlan.day}`} className="flex-1">
                <Button size="lg" variant="outline" className="w-full h-12 text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  QT
                </Button>
              </Link>
              
              {/* 완료 체크 - 아이콘만 */}
              <button
                onClick={handleCheckClick}
                className={cn(
                  "flex items-center justify-center h-12 w-12 shrink-0 rounded-xl text-sm font-semibold transition-all",
                  isRead
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-muted/50 border-2 border-border text-foreground hover:bg-muted"
                )}
                aria-label={isRead ? "읽음 완료 해제" : "읽음 완료"}
              >
                <Check className={cn("w-5 h-5", checkAnimation && "animate-in zoom-in-50")} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 피드 탭 */}
      <div className="sticky top-[200px] lg:top-[156px] z-20 bg-background border-b">
        <div className="max-w-2xl mx-auto">
          <FeedTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
      </div>

      {/* 피드 컨텐츠 */}
      <div className="flex-1 max-w-2xl mx-auto w-full pb-24">
        {feedLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : feedItems.length === 0 ? (
          <FeedEmptyState
            tab={activeTab}
            hasGroups={!!activeGroup}
            hasChurch={!!church}
          />
        ) : (
          <>
            {feedItems.map((item) => (
              <UnifiedFeedCard
                key={`${item.source}-${item.id}`}
                item={item}
                currentUserId={userId}
                onLike={handleLike}
                onComment={handleComment}
                onSourceClick={handleSourceClick}
                onChurchClick={handleChurchClick}
                onAuthorClick={handleAuthorClick}
                onViewDetail={handleViewDetail}
              />
            ))}

            {/* 무한 스크롤 로딩 트리거 */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>

      {/* 묵상 작성 FAB */}
      {currentPlan && (
        <Link
          href={`/qt/${currentPlan.day}`}
          className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40"
        >
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <PenLine className="w-6 h-6" />
          </Button>
        </Link>
      )}

      {/* 피드 상세 모달 */}
      <FeedDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={selectedItem}
        currentUserId={userId}
        onLike={handleLike}
        onAuthorClick={handleAuthorClick}
      />

      {/* Onboarding Tutorial */}
      <OnboardingTutorial open={showOnboarding} onComplete={handleOnboardingComplete} />

      {/* 읽음 완료 확인 다이얼로그 */}
      <AlertDialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRead ? '읽음 완료를 해제하시겠습니까?' : '읽음 완료 처리하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {currentPlan && (isRead
                ? `Day ${currentPlan.day} - ${currentPlan.book}의 읽음 완료 표시가 해제됩니다.`
                : `Day ${currentPlan.day} - ${currentPlan.book}을(를) 읽음 완료로 표시합니다.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheck}>
              {isRead ? '해제하기' : '완료하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

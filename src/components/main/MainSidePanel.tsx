'use client';

/**
 * MainSidePanel - 메인 페이지 PC 우측 사이드 패널
 *
 * LG 화면(1024px 이상)에서 표시되는 우측 패널입니다.
 * 개인 진행률, 오늘의 읽기, 추천 사용자 등을 표시합니다.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, TrendingUp, Users, ChevronRight, Sparkles, User, Loader2 } from 'lucide-react';
import { useMainData } from '@/contexts/MainDataContext';
import { useDashboardStats } from '@/presentation/hooks/queries/useDashboardStats';
import { useSuggestedUsers } from '@/presentation/hooks/queries/useSuggestedUsers';
import { useFollow } from '@/presentation/hooks/queries/useUserFollow';
import readingPlan from '@/data/reading_plan.json';
import { getTodayDateString } from '@/lib/date-utils';
import type { ReadingPlan } from '@/types';

export function MainSidePanel() {
  // Context에서 사용자 데이터 가져오기
  const { user, activeGroup, isLoading: contextLoading } = useMainData();
  const userId = user?.id ?? null;
  const churchId = user?.churchId ?? null;

  // 대시보드 통계 (진행률)
  const { data: stats, isLoading: statsLoading } = useDashboardStats(userId);

  // 추천 사용자
  const { data: suggestedUsers = [], isLoading: suggestedLoading } = useSuggestedUsers(userId, churchId, 3);

  // 팔로우 뮤테이션
  const followMutation = useFollow();

  // 오늘의 읽기 계산
  const todayPlan = useMemo(() => {
    const todayStr = getTodayDateString();
    const plans = readingPlan as ReadingPlan[];

    // 정확한 날짜 매치
    const exactMatch = plans.find(p => p.date === todayStr);
    if (exactMatch) return exactMatch;

    // 오늘 이전의 가장 최근 일정
    const pastPlans = plans.filter(p => p.date <= todayStr);
    if (pastPlans.length > 0) {
      return pastPlans[pastPlans.length - 1];
    }

    // 미래의 첫 일정
    const futurePlans = plans.filter(p => p.date > todayStr);
    return futurePlans[0] ?? null;
  }, []);

  // 진행률 데이터
  const readingProgress = useMemo(() => {
    if (!stats) {
      return { currentDay: 0, totalDays: 365, percentage: 0 };
    }
    // progressPercent를 기반으로 완료 일수 계산
    const completedDays = Math.round((stats.progressPercent / 100) * 365);
    return {
      currentDay: completedDays,
      totalDays: 365,
      percentage: stats.progressPercent,
    };
  }, [stats]);

  // 오늘의 읽기 데이터
  const todayReading = useMemo(() => {
    if (!todayPlan) {
      return { range: '일정 없음', book: '' };
    }
    return {
      range: todayPlan.reading,
      book: todayPlan.book,
    };
  }, [todayPlan]);

  // 팔로우 핸들러
  const handleFollow = async (targetUserId: string) => {
    if (!userId) return;
    try {
      await followMutation.mutateAsync({ followerId: userId, followingId: targetUserId });
    } catch {
      // 에러는 훅에서 처리
    }
  };

  // 로딩 상태
  const isLoading = contextLoading || statsLoading;

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 border-l border-border/60 bg-gradient-to-b from-muted/30 to-background h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* 사용자 프로필 카드 */}
        {isLoading ? (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : user ? (
          <Card className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20 dark:ring-primary/30">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {user.nickname?.[0] ?? <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {user.nickname ?? '사용자'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    통독 {readingProgress.currentDay}일 완료
                  </p>
                </div>
                <Link href="/mypage">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* 오늘의 읽기 */}
        {isLoading ? (
          <Card className="border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ) : activeGroup ? (
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BookOpen className="w-4 h-4" />
                오늘의 읽기
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">통독 범위</p>
                <p className="font-medium text-sm">{todayReading.range}</p>
              </div>
              {todayPlan?.memory_verse && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">암송 구절</p>
                  <p className="font-medium text-sm">{todayPlan.memory_verse}</p>
                </div>
              )}
              <Link href={todayPlan ? `/qt/${todayPlan.day}` : '/bible'}>
                <Button size="sm" className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  묵상 시작하기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <BookOpen className="w-4 h-4" />
                그룹에 참여하세요
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                그룹에 참여하여 함께 성경을 읽어보세요!
              </p>
              <Link href="/group">
                <Button size="sm" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  그룹 찾기
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 진행률 */}
        {isLoading ? (
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                연간 통독 진행률
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{readingProgress.currentDay}일 완료</span>
                <span className="font-semibold text-primary">{readingProgress.percentage}%</span>
              </div>
              <Progress value={readingProgress.percentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {readingProgress.totalDays - readingProgress.currentDay}일 남음
              </p>
            </CardContent>
          </Card>
        )}

        {/* 추천 사용자 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                추천 사용자
              </CardTitle>
              <Link href="/community?tab=all" className="text-xs text-primary hover:underline">
                더보기
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {suggestedLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-7 w-14" />
                  </div>
                ))}
              </>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map((recUser) => (
                <div key={recUser.id} className="flex items-center gap-3">
                  <Link href={`/profile/${recUser.id}`}>
                    <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                      <AvatarImage src={recUser.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {recUser.nickname?.[0] ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${recUser.id}`}>
                      <p className="text-sm font-medium truncate hover:text-primary cursor-pointer">
                        {recUser.nickname}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      팔로워 {recUser.followersCount}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleFollow(recUser.id)}
                    disabled={followMutation.isPending}
                  >
                    {followMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      '팔로우'
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                추천할 사용자가 없습니다
              </p>
            )}
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>Reading Jesus &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </aside>
  );
}

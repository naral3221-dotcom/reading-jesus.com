'use client';

import { HomeSkeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { Loader2, Search, Bell } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { PublicFeed } from '@/components/feed/PublicFeed';
import type { UnifiedFeedItem, FeedSource } from '@/components/feed/UnifiedFeedCard';
import { UnifiedFeedCard } from '@/components/feed/UnifiedFeedCard';
import { FeedTabs, FeedTypeTabs, FeedEmptyState, type FeedTabType, type FeedContentType } from '@/components/feed/FeedTabs';
import { FeedDetailModal } from '@/components/feed/FeedDetailModal';
import { useUnifiedFeedInfinite } from '@/presentation/hooks/queries/useUnifiedFeed';
import { useUpdateProfile } from '@/presentation/hooks/queries/useUser';
import { useMainData } from '@/contexts/MainDataContext';
import { useRouter } from 'next/navigation';

// 새로 추가된 컴포넌트들
import { ChurchQuickLink } from '@/components/home/ChurchQuickLink';
import { QuickActionButtons } from '@/components/home/QuickActionButtons';
import { PlatformStats } from '@/components/home/PlatformStats';
import { InlineMeditationForm } from '@/components/home/InlineMeditationForm';

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

  const [showOnboarding, setShowOnboarding] = useState(false);

  // 피드 관련 상태
  const [activeTab, setActiveTab] = useState<FeedTabType>('all');
  const [contentType, setContentType] = useState<FeedContentType>('all');
  const [selectedItem, setSelectedItem] = useState<UnifiedFeedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const userId = user?.id ?? null;

  // 프로필 업데이트 뮤테이션
  const updateProfile = useUpdateProfile();

  // 통합 피드 조회
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUnifiedFeedInfinite({ tab: activeTab, typeFilter: contentType });

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

  if (contextLoading) {
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

  // 비로그인: PublicFeed (인스타그램 스타일)
  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <PublicFeed isLoggedIn={false} previewLimit={5} />
      </div>
    );
  }

  // 로그인됨: 새로운 홈 레이아웃
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 모바일 커스텀 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border lg:hidden">
        <div className="relative flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          {/* 좌측: 빈 공간 (균형을 위해) */}
          <div className="w-10" />

          {/* 중앙: 로고 */}
          <Link
            href="/home"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Reading Jesus"
              width={40}
              height={40}
              className="w-9 h-9 rounded-lg"
            />
            <span className="text-[26px] font-logo tracking-tight text-foreground whitespace-nowrap">
              Reading Jesus
            </span>
          </Link>

          {/* 우측: 검색 + 알림 */}
          <div className="flex items-center gap-1">
            <Link
              href="/search"
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/60 transition-colors"
              aria-label="검색"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/notifications"
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/60 transition-colors"
              aria-label="알림"
            >
              <Bell className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="pt-14 lg:pt-0">
        {/* 상단 섹션: 빠른 액션 + 묵상 작성 + 통계 */}
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
          {/* 1. 소속 교회 바로가기 (조건부) */}
          <ChurchQuickLink church={church} />

          {/* 2. 빠른 액션 버튼 (오늘의 말씀읽기 + QT 작성하기) */}
          <QuickActionButtons />

          {/* 3. 짧은 묵상 작성하기 (인라인 폼) */}
          <InlineMeditationForm userId={userId} />

          {/* 4. 플랫폼 통계 */}
          <PlatformStats />
        </div>

        {/* 피드 탭 */}
        <div className="sticky top-14 lg:top-0 z-20 bg-background border-b">
          <div className="max-w-2xl mx-auto">
            <FeedTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {/* 콘텐츠 타입 필터 */}
            <FeedTypeTabs
              activeType={contentType}
              onTypeChange={setContentType}
              className="border-t border-border/50"
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
      </main>

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
    </div>
  );
}

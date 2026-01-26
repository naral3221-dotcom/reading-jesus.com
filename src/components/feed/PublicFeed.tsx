'use client';

import { useState } from 'react';
import { usePublicFeed, useInfiniteScroll } from '@/hooks/usePublicFeed';
import { PublicFeedCard } from './PublicFeedCard';
import { FeedFilters } from './FeedFilters';
import { LoginPromptOverlay, LoginRequiredModal } from './LoginPromptOverlay';
import { Loader2, RefreshCw, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublicFeedProps {
  isLoggedIn?: boolean;
  previewLimit?: number;
}

export function PublicFeed({ isLoggedIn = false, previewLimit = 5 }: PublicFeedProps) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    filters,
    setFilters,
    loadMore,
    refresh,
    handleLike,
  } = usePublicFeed();

  // 무한 스크롤 (로그인 사용자만)
  const scrollTargetRef = useInfiniteScroll(
    loadMore,
    hasMore && isLoggedIn,
    isLoading || isLoadingMore
  );

  const handleLoginRequired = () => {
    setShowLoginModal(true);
  };

  const handleComment = (itemId: string) => {
    // 댓글 페이지로 이동 또는 모달 표시
    // 현재는 간단히 교회 페이지로 이동
    const item = items.find(i => i.id === itemId);
    if (item) {
      window.location.href = `/church/${item.churchCode}`;
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">묵상을 불러오는 중...</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Frown className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">피드를 불러오지 못했습니다</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  // 빈 상태
  if (items.length === 0) {
    return (
      <>
        <FeedFilters filters={filters} onFilterChange={setFilters} />
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Frown className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-center">
            아직 공유된 묵상이 없습니다
          </p>
          <p className="text-sm text-muted-foreground/70 text-center mt-1">
            첫 번째로 묵상을 나눠보세요!
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 필터 */}
      <FeedFilters filters={filters} onFilterChange={setFilters} />

      {/* 피드 목록 */}
      <div className="px-4 py-4 space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative">
            <PublicFeedCard
              item={item}
              isLoggedIn={isLoggedIn}
              showBlur={!isLoggedIn && index >= previewLimit}
              onLike={handleLike}
              onComment={handleComment}
              onLoginRequired={handleLoginRequired}
            />
            {/* 로그인 유도 오버레이 (첫 번째 블러 아이템에만) */}
            {!isLoggedIn && (
              <LoginPromptOverlay itemIndex={index} previewLimit={previewLimit} />
            )}
          </div>
        ))}

        {/* 더 로드 트리거 (로그인 사용자만) */}
        {isLoggedIn && hasMore && (
          <div ref={scrollTargetRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            )}
          </div>
        )}

        {/* 비로그인 사용자: 더 보기 버튼 대신 로그인 유도 */}
        {!isLoggedIn && items.length > previewLimit && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">
              {items.length - previewLimit}개의 묵상이 더 있습니다
            </p>
          </div>
        )}

        {/* 로그인 사용자: 끝 표시 */}
        {isLoggedIn && !hasMore && items.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            모든 묵상을 확인했습니다
          </div>
        )}
      </div>

      {/* 로그인 모달 */}
      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

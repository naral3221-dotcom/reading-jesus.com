'use client';

/**
 * UnifiedGroupFeed 컴포넌트
 *
 * 그룹의 묵상(free)과 QT(qt)를 통합하여 표시하는 피드 컴포넌트입니다.
 * 교회 그룹 페이지와 메인 그룹 페이지에서 동일하게 사용.
 *
 * 기능:
 * - 전체/묵상/QT 필터 탭
 * - 피드 모드(전체 날짜) / 일자별 모드 토글
 * - 통합 피드 카드 렌더링
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ListFilter, Calendar, Rss } from 'lucide-react';
import { UnifiedFeedCard, UnifiedFeedItem, FeedSource } from './UnifiedFeedCard';
import { useGroupUnifiedFeed } from '@/presentation/hooks/queries/useUnifiedMeditation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 피드 필터 타입
export type ContentTypeFilter = 'all' | 'free' | 'qt';
export type ViewMode = 'feed' | 'day';

interface UnifiedGroupFeedProps {
  groupId: string;
  groupName?: string;
  churchCode?: string;
  currentUserId?: string | null;
  viewMode?: ViewMode;
  currentDay?: number;
  onViewModeChange?: (mode: ViewMode) => void;
  onDayChange?: (day: number) => void;
  showViewModeToggle?: boolean;
  showFilters?: boolean;
  onLike?: (id: string, source: FeedSource) => void;
  onComment?: (id: string, source: FeedSource) => void;
  onEdit?: (item: UnifiedFeedItem) => void;
  onDelete?: (item: UnifiedFeedItem) => void;
  onViewDetail?: (item: UnifiedFeedItem) => void;
  className?: string;
}

export function UnifiedGroupFeed({
  groupId,
  groupName,
  churchCode,
  currentUserId,
  viewMode: externalViewMode,
  currentDay,
  onViewModeChange,
  onDayChange,
  showViewModeToggle = true,
  showFilters = true,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onViewDetail,
  className,
}: UnifiedGroupFeedProps) {
  const router = useRouter();
  const [contentFilter, setContentFilter] = useState<ContentTypeFilter>('all');
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('feed');

  // 외부 또는 내부 viewMode 사용
  const viewMode = externalViewMode ?? internalViewMode;
  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  // 통합 피드 데이터 조회
  const {
    data: feedData,
    isLoading,
    isError,
    error,
  } = useGroupUnifiedFeed(groupId, {
    viewMode,
    currentDay,
    contentTypeFilter: contentFilter,
    userId: currentUserId,
    limit: 50,
  });

  // UnifiedMeditation → UnifiedFeedItem 변환
  const feedItems: UnifiedFeedItem[] = (feedData ?? []).map((m) => ({
    id: m.id,
    type: m.contentType === 'qt' ? 'qt' : 'meditation',
    source: 'group' as FeedSource,
    sourceName: groupName || m.sourceName,
    sourceId: m.sourceId,
    churchCode,
    authorId: m.userId || '',
    authorName: m.authorName,
    authorAvatarUrl: m.profile?.avatarUrl,
    isAnonymous: m.isAnonymous,
    createdAt: m.createdAt.toISOString(),
    dayNumber: m.dayNumber,
    bibleRange: m.bibleRange,
    content: m.content || undefined,
    qtDate: m.qtDate?.toISOString(),
    mySentence: m.mySentence,
    meditationAnswer: m.meditationAnswer,
    gratitude: m.gratitude,
    myPrayer: m.myPrayer,
    dayReview: m.dayReview,
    likesCount: m.likesCount,
    repliesCount: m.repliesCount,
    isLiked: m.isLiked,
  }));

  // 핸들러
  const handleLike = useCallback((id: string, source: FeedSource) => {
    onLike?.(id, source);
  }, [onLike]);

  const handleComment = useCallback((id: string, source: FeedSource) => {
    onComment?.(id, source);
  }, [onComment]);

  const handleAuthorClick = useCallback((authorId: string) => {
    router.push(`/profile/${authorId}`);
  }, [router]);

  const handleSourceClick = useCallback((source: FeedSource, sourceId?: string) => {
    if (source === 'group' && sourceId) {
      router.push(`/group/${sourceId}`);
    }
  }, [router]);

  const handleChurchClick = useCallback((code: string) => {
    router.push(`/church/${code}`);
  }, [router]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>피드를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm mt-1">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 필터 & 보기 모드 헤더 */}
      {(showFilters || showViewModeToggle) && (
        <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm sticky top-0 z-10 border-b border-border/40">
          {/* 콘텐츠 타입 필터 */}
          {showFilters && (
            <Tabs value={contentFilter} onValueChange={(v) => setContentFilter(v as ContentTypeFilter)}>
              <TabsList className="h-8 bg-muted/50">
                <TabsTrigger value="all" className="text-xs px-3 h-7">
                  전체
                </TabsTrigger>
                <TabsTrigger value="free" className="text-xs px-3 h-7">
                  묵상
                </TabsTrigger>
                <TabsTrigger value="qt" className="text-xs px-3 h-7">
                  QT
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* 보기 모드 토글 */}
          {showViewModeToggle && (
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'feed' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => handleViewModeChange('feed')}
              >
                <Rss className="w-4 h-4 mr-1.5" />
                피드
              </Button>
              <Button
                variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => handleViewModeChange('day')}
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                일자별
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 피드 목록 */}
      <div className="space-y-0">
        {feedItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ListFilter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {contentFilter === 'all'
                ? '아직 작성된 묵상이 없습니다.'
                : contentFilter === 'free'
                ? '아직 작성된 묵상이 없습니다.'
                : '아직 작성된 QT가 없습니다.'}
            </p>
            <p className="text-sm mt-1">
              첫 번째 {contentFilter === 'qt' ? 'QT' : '묵상'}을 작성해보세요!
            </p>
          </div>
        ) : (
          feedItems.map((item) => (
            <UnifiedFeedCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              showSource={false}
              onLike={handleLike}
              onComment={handleComment}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetail={onViewDetail}
              onAuthorClick={handleAuthorClick}
              onSourceClick={handleSourceClick}
              onChurchClick={handleChurchClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

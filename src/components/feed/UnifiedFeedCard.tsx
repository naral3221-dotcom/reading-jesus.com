'use client';

/**
 * UnifiedFeedCard 컴포넌트
 *
 * 통합 피드 카드입니다.
 * 그룹/교회/개인 묵상을 통합하여 표시합니다.
 * - QT: QTFeedCard 컴포넌트 사용 (인스타그램 스타일)
 * - 묵상: 기존 카드 스타일 유지
 */

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Bookmark,
  BookmarkCheck,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useIsBookmarked, useToggleBookmark } from '@/presentation/hooks/queries/useUserBookmarks';

// HTML 콘텐츠 렌더링을 위한 dynamic import (SSR 비활성화)
const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then((mod) => mod.RichViewerWithEmbed),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted h-20 rounded" /> }
);
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime } from '@/lib/date-utils';
import { useFeedCard } from './hooks/useFeedCard';
import {
  FeedCardAvatar,
  FeedCardContent,
} from './components';
import { MediaCarousel } from './components/MediaCarousel';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { QTFeedCard } from './QTFeedCard';
import { shareOrCopy, getFeedItemShareUrl, getFeedShareData } from '@/lib/share-utils';
import { useToast } from '@/components/ui/toast';

// 피드 소스 타입
export type FeedSource = 'group' | 'church' | 'personal';

// 피드 아이템 타입
export type FeedItemType = 'meditation' | 'qt';

export interface UnifiedFeedItem {
  id: string;
  type: FeedItemType;
  source: FeedSource;
  sourceName?: string;
  sourceId?: string;
  churchName?: string;
  churchCode?: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  isAnonymous: boolean;
  createdAt: string;
  dayNumber?: number | null;
  bibleRange?: string | null;
  content?: string;
  qtDate?: string;
  mySentence?: string | null;
  meditationAnswer?: string | null;
  meditationQuestion?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isPublic?: boolean;
}

export type FeedCardVariant = 'full' | 'compact' | 'minimal';

interface UnifiedFeedCardProps {
  item: UnifiedFeedItem;
  currentUserId?: string | null;
  variant?: FeedCardVariant;
  showSource?: boolean;
  onLike: (id: string, source: FeedSource) => void;
  onComment: (id: string, source: FeedSource) => void;
  onEdit?: (item: UnifiedFeedItem) => void;
  onDelete?: (item: UnifiedFeedItem) => void;
  onViewDetail?: (item: UnifiedFeedItem) => void;
  onSourceClick?: (source: FeedSource, sourceId?: string) => void;
  onChurchClick?: (churchCode: string) => void;
  onAuthorClick?: (authorId: string) => void;
  qtContent?: unknown;
}

export function UnifiedFeedCard({
  item,
  currentUserId,
  variant: _variant = 'full',
  showSource = true,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onViewDetail,
  onSourceClick,
  onChurchClick,
  onAuthorClick,
}: UnifiedFeedCardProps) {
  const {
    isLiked,
    likesCount,
    displayName,
    avatarColor,
    initials,
    contentWithoutImages,
    images,
    handleLikeClick,
    handleCommentClick,
    qtSections,
    isHtmlContent,
  } = useFeedCard({ item });

  const isOwner = currentUserId && item.authorId && currentUserId === item.authorId;

  // 북마크 기능
  const { data: isBookmarked = false } = useIsBookmarked(item.id, currentUserId ?? null);
  const toggleBookmark = useToggleBookmark();

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    toggleBookmark.mutate({
      meditationId: item.id,
      userId: currentUserId,
      source: 'unified',
    });
  }, [currentUserId, item.id, toggleBookmark]);

  const handleLike = (e: React.MouseEvent) => {
    handleLikeClick(e);
    onLike(item.id, item.source);
  };

  const handleComment = (e: React.MouseEvent) => {
    handleCommentClick(e);
    onComment(item.id, item.source);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAnonymous) onAuthorClick?.(item.authorId);
  };

  const { toast } = useToast();

  const handleCopyLink = async () => {
    const shareUrl = getFeedItemShareUrl({
      type: item.type,
      id: item.id,
      churchCode: item.churchCode,
      qtDate: item.qtDate,
    });

    const shareData = getFeedShareData(
      {
        type: item.type,
        authorName: item.authorName,
        content: item.content,
        mySentence: item.mySentence,
        isAnonymous: item.isAnonymous,
      },
      shareUrl
    );

    await shareOrCopy(
      shareData,
      (method) => {
        toast({
          variant: 'success',
          title: method === 'clipboard' ? '링크가 복사되었습니다' : '공유되었습니다',
        });
      },
      () => {
        toast({ variant: 'error', title: '공유에 실패했습니다' });
      }
    );
  };

  // 묵상글은 항상 전체 표시 (더보기 없음)
  const displayedContent = contentWithoutImages;

  // 소스 라벨 생성
  const getSourceLabel = () => {
    if (item.source === 'church') return item.churchName || item.sourceName;
    if (item.source === 'group') return item.sourceName;
    return '개인';
  };

  // QT 타입: QTFeedCard 컴포넌트 사용 (인스타그램 스타일)
  if (item.type === 'qt') {
    return (
      <QTFeedCard
        item={item}
        currentUserId={currentUserId}
        showSource={showSource}
        onLike={onLike}
        onComment={onComment}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
        onSourceClick={onSourceClick}
        onChurchClick={onChurchClick}
        onAuthorClick={onAuthorClick}
      />
    );
  }

  // 묵상 타입: QT 카드와 일관된 스타일
  return (
    <article className="mx-3 my-4 lg:mx-0 overflow-hidden">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden w-full">
        {/* ========== 프로필 헤더 (상단 - QT와 동일) ========== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div
              className="cursor-pointer"
              onClick={handleUserClick}
            >
              <FeedCardAvatar
                avatarUrl={item.authorAvatarUrl}
                avatarColor={avatarColor}
                initials={initials}
                displayName={displayName}
                isAnonymous={item.isAnonymous}
                className="w-10 h-10 ring-2 ring-primary/20"
                onClick={handleUserClick}
              />
            </div>

            {/* 이름 + 배지 + 소스 + 시간 */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  className="text-[14px] font-bold hover:text-primary transition-colors"
                  onClick={handleUserClick}
                >
                  {displayName}
                </button>
                {/* 묵상 배지 */}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-semibold">
                  묵상
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                {showSource && (
                  <>
                    <button
                      className="hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.source === 'church' && item.churchCode) {
                          onChurchClick?.(item.churchCode);
                        } else if (item.source === 'group') {
                          onSourceClick?.(item.source, item.sourceId);
                        }
                      }}
                    >
                      {getSourceLabel()}
                    </button>
                    <span className="text-border">·</span>
                  </>
                )}
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {isOwner ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      수정
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-destructive focus:text-destructive gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  링크 복사
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ========== 성경 구절 헤더 ========== */}
        {item.bibleRange && (
          <div className="px-4 py-3 bg-muted/20 border-b border-border/40">
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium">{item.bibleRange}</span>
            </p>
          </div>
        )}

        {/* ========== 이미지 영역 ========== */}
        {images.length > 0 && (
          <div className="bg-muted/30">
            <MediaCarousel
              images={images}
              onImageClick={() => onViewDetail?.(item)}
            />
          </div>
        )}

        {/* ========== 묵상 콘텐츠 (항상 전체 표시) ========== */}
        <div className="px-4 py-4">
          {isHtmlContent ? (
            <RichViewerWithEmbed
              content={displayedContent}
              className="text-base leading-relaxed"
            />
          ) : (
            <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
              {displayedContent}
            </p>
          )}
        </div>

        {/* ========== 액션 바 ========== */}
        <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 좋아요 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 px-3 rounded-full transition-all",
                isLiked && "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
              )}
              onClick={handleLike}
            >
              <Heart className={cn(
                "w-5 h-5 transition-all",
                isLiked && "fill-current scale-110"
              )} />
              {likesCount > 0 && <span className="text-sm font-medium">{likesCount}</span>}
            </Button>

            {/* 댓글 */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-3 rounded-full"
              onClick={handleComment}
            >
              <MessageCircle className="w-5 h-5" />
              {item.repliesCount > 0 && <span className="text-sm font-medium">{item.repliesCount}</span>}
            </Button>
          </div>

          {/* 북마크 */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-all",
              isBookmarked && "text-primary"
            )}
            onClick={handleBookmark}
            disabled={toggleBookmark.isPending || !currentUserId}
          >
            {toggleBookmark.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 fill-current" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

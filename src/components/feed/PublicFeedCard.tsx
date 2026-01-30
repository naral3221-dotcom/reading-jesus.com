'use client';

/**
 * PublicFeedCard 컴포넌트
 *
 * 카드 강조 스타일의 공개 피드 카드입니다.
 * 로그인 체크, 블러 효과 등의 기능을 포함합니다.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { formatRelativeTime } from '@/lib/date-utils';
import type { PublicFeedItem } from '@/types';
import { useFeedCard } from './hooks/useFeedCard';
import {
  FeedCardAvatar,
  FeedCardContent,
  FeedCardImages,
} from './components';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PublicFeedCardProps {
  item: PublicFeedItem;
  onLike?: (id: string, type: 'meditation' | 'qt') => void;
  onComment?: (id: string, type: 'meditation' | 'qt') => void;
  onLoginRequired?: () => void;
  isLoggedIn?: boolean;
  showBlur?: boolean;
}

export function PublicFeedCard({
  item,
  onLike,
  onComment,
  onLoginRequired,
  isLoggedIn = false,
  showBlur = false,
}: PublicFeedCardProps) {
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
  } = useFeedCard({ item, isLoggedIn, onLoginRequired });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    handleLikeClick(e);
    if (isLoggedIn) {
      onLike?.(item.id, item.type);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    handleCommentClick(e);
    if (isLoggedIn) {
      onComment?.(item.id, item.type);
    }
  };

  // 콘텐츠 길이 체크
  const shouldTruncate = !isExpanded && contentWithoutImages.length > 120;
  const displayedContent = shouldTruncate
    ? contentWithoutImages.slice(0, 120) + '...'
    : contentWithoutImages;

  return (
    <article className={cn(
      "mx-3 my-4 lg:mx-0",
      showBlur && "blur-sm pointer-events-none"
    )}>
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* 헤더: 성경 구절 배지 + 타입 */}
        {(item.dayNumber || item.bibleRange) && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {item.dayNumber && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  Day {item.dayNumber}
                </span>
              )}
              {item.bibleRange && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-warm/80 text-white text-xs font-medium">
                  {item.bibleRange}
                </span>
              )}
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                item.type === 'qt'
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              )}>
                {item.type === 'qt' ? 'QT' : '묵상'}
              </span>
            </div>
          </div>
        )}

        {/* 작성자 정보 */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* 아바타 - 프로필 링크 (익명이 아니고 authorId가 있는 경우) */}
          {!item.isAnonymous && item.authorId ? (
            <Link
              href={`/profile/${item.authorId}`}
              onClick={(e) => e.stopPropagation()}
            >
              <FeedCardAvatar
                avatarColor={avatarColor}
                initials={initials}
                avatarUrl={item.authorAvatarUrl}
                displayName={displayName}
                isAnonymous={item.isAnonymous}
                className="w-11 h-11 ring-2 ring-background cursor-pointer hover:ring-primary/50 transition-all"
              />
            </Link>
          ) : (
            <FeedCardAvatar
              avatarColor={avatarColor}
              initials={initials}
              displayName={displayName}
              isAnonymous={item.isAnonymous}
              className="w-11 h-11 ring-2 ring-background"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* 작성자 이름 - 프로필 링크 (익명이 아니고 authorId가 있는 경우) */}
              {!item.isAnonymous && item.authorId ? (
                <Link
                  href={`/profile/${item.authorId}`}
                  className="font-bold text-[15px] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayName}
                </Link>
              ) : (
                <span className="font-bold text-[15px]">{displayName}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Link
                href={`/church/${item.churchCode}`}
                className="hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {item.churchName}
              </Link>
              <span className="text-border">•</span>
              <span>{formatRelativeTime(item.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 이미지 */}
        {images.length > 0 && (
          <div className="bg-muted/30">
            <FeedCardImages images={images} />
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="px-4 py-4">
          {item.type === 'meditation' ? (
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {displayedContent}
              </p>
              {shouldTruncate && (
                <button
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  onClick={() => setIsExpanded(true)}
                >
                  더 보기
                </button>
              )}
            </div>
          ) : (
            // QT 콘텐츠 - 섹션 구분형
            <div className="space-y-4">
              {item.mySentence && (
                <div className="relative pl-4 py-2 border-l-4 border-primary/40 bg-primary/5 rounded-r-lg">
                  <p className="text-[15px] italic text-foreground/90 leading-relaxed">
                    "{item.mySentence}"
                  </p>
                  <span className="text-[11px] text-muted-foreground mt-1 block">오늘의 한 문장</span>
                </div>
              )}

              {isExpanded && qtSections.length > 0 && (
                <FeedCardContent
                  type={item.type}
                  isHtmlContent={isHtmlContent}
                  contentWithoutImages={contentWithoutImages}
                  plainContent={item.content}
                  qtSections={qtSections}
                />
              )}

              {!isExpanded && qtSections.length > 0 && (
                <button
                  className="text-primary hover:text-primary/80 text-sm font-medium"
                  onClick={() => setIsExpanded(true)}
                >
                  QT 전체 보기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 상호작용 영역 */}
        <div className="px-4 pb-4 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
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

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-3 rounded-full"
                onClick={handleComment}
              >
                <MessageCircle className="w-5 h-5" />
                {item.repliesCount > 0 && <span className="text-sm font-medium">{item.repliesCount}</span>}
              </Button>

              <Button variant="ghost" size="sm" className="px-3 rounded-full">
                <Send className="w-5 h-5 -rotate-45" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="rounded-full">
              <Bookmark className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

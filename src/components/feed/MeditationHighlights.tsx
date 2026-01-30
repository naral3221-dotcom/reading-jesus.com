'use client';

/**
 * MeditationHighlights - 인기 묵상 하이라이트 (인스타 스토리 스타일)
 * 좋아요 많이 받은 묵상을 가로 스크롤 카드로 표시
 */

import { useRef, useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePopularMeditations } from '@/presentation/hooks/queries/usePublicMeditation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation';

interface MeditationHighlightsProps {
  currentUserId?: string | null;
  onItemClick?: (meditation: PublicMeditationProps) => void;
  onAuthorClick?: (authorId: string) => void;
  className?: string;
}

export function MeditationHighlights({
  currentUserId,
  onItemClick,
  onAuthorClick,
  className,
}: MeditationHighlightsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { data: meditations, isLoading } = usePopularMeditations({
    limit: 10,
    currentUserId: currentUserId ?? undefined,
    daysAgo: 30, // 최근 30일
  });

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className={cn("py-3", className)}>
        <div className="flex items-center gap-2 px-4 mb-3">
          <Sparkles className="w-4 h-4 text-accent-warm" />
          <span className="text-sm font-medium text-foreground">최근 묵상</span>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-40 h-48 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 데이터 없으면 숨김
  if (!meditations || meditations.length === 0) {
    // 디버깅용: 데이터 없을 때도 표시
    return (
      <div className={cn("py-3 bg-muted/30", className)}>
        <div className="flex items-center gap-2 px-4">
          <Sparkles className="w-4 h-4 text-accent-warm" />
          <span className="text-sm text-muted-foreground">
            아직 인기 묵상이 없어요 (좋아요 2개 이상, 최근 30일)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("py-3 relative group", className)}>
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <Sparkles className="w-4 h-4 text-accent-warm" />
        <span className="text-sm font-medium text-foreground">최근 묵상</span>
      </div>

      {/* 좌우 스크롤 버튼 (데스크톱) */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 shadow-md border border-border hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          aria-label="왼쪽으로 스크롤"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-background/90 shadow-md border border-border hover:bg-muted transition-all opacity-0 group-hover:opacity-100"
          aria-label="오른쪽으로 스크롤"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* 카드 리스트 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 px-4 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {meditations.map((meditation) => (
          <HighlightCard
            key={meditation.id}
            meditation={meditation}
            onClick={() => onItemClick?.(meditation)}
            onAuthorClick={() => {
              if (!meditation.isAnonymous && meditation.userId) {
                onAuthorClick?.(meditation.userId);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface HighlightCardProps {
  meditation: PublicMeditationProps;
  onClick?: () => void;
  onAuthorClick?: () => void;
}

function HighlightCard({ meditation, onClick, onAuthorClick }: HighlightCardProps) {
  const displayName = meditation.isAnonymous
    ? '익명'
    : meditation.profile?.nickname ?? '사용자';
  const avatarUrl = meditation.isAnonymous ? null : meditation.profile?.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  // 내용 미리보기 (50자)
  const contentPreview = meditation.content.length > 50
    ? meditation.content.slice(0, 50) + '...'
    : meditation.content;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-40 h-48 rounded-xl overflow-hidden cursor-pointer",
        "bg-gradient-to-br from-primary/10 via-background to-accent-warm/10",
        "border border-border/50 shadow-sm",
        "hover:shadow-md hover:border-primary/30 transition-all duration-200",
        "flex flex-col"
      )}
    >
      {/* 상단: 프로필 */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAuthorClick?.();
          }}
          className={cn(
            "flex-shrink-0",
            !meditation.isAnonymous && "hover:opacity-80 transition-opacity"
          )}
          disabled={meditation.isAnonymous}
        >
          <Avatar className="w-7 h-7 ring-2 ring-primary/30">
            <AvatarImage src={avatarUrl ?? undefined} />
            <AvatarFallback className="text-xs bg-primary/20 text-primary">
              {initial}
            </AvatarFallback>
          </Avatar>
        </button>
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {displayName}
        </span>
      </div>

      {/* 중앙: 내용 미리보기 */}
      <div className="flex-1 px-3 pb-2 overflow-hidden">
        {meditation.bibleReference && (
          <p className="text-[10px] text-primary font-medium mb-1 truncate">
            {meditation.bibleReference}
          </p>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {contentPreview}
        </p>
      </div>

      {/* 하단: 좋아요 수 */}
      <div className="flex items-center gap-1 px-3 pb-3">
        <Heart
          className={cn(
            "w-3.5 h-3.5",
            meditation.isLiked ? "fill-accent-warm text-accent-warm" : "text-muted-foreground"
          )}
        />
        <span className="text-xs text-muted-foreground">
          {meditation.likesCount}
        </span>
      </div>
    </div>
  );
}

export default MeditationHighlights;

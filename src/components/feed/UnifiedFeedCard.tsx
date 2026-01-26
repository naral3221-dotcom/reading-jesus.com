'use client';

/**
 * UnifiedFeedCard 컴포넌트
 *
 * Instagram/Threads 스타일의 깔끔한 피드 카드입니다.
 * 그룹/교회/개인 묵상을 통합하여 표시합니다.
 */

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  Church,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import { extractImagesFromHtml, removeImagesFromHtml } from '@/components/ui/rich-editor';
import dynamic from 'next/dynamic';

const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

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
  // QT 관련 props 제거 - 단순화
  qtContent?: unknown;
}

export function UnifiedFeedCard({
  item,
  currentUserId,
  variant = 'full',
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
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);

  const isOwner = currentUserId && item.authorId && currentUserId === item.authorId;
  const displayName = item.isAnonymous ? '익명' : item.authorName;
  const avatarColor = item.isAnonymous ? 'bg-gray-400' : getAvatarColor(item.authorName);
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName);

  // 콘텐츠에서 이미지 분리
  const { contentWithoutImages, images } = useMemo(() => {
    if (item.type === 'meditation' && item.content?.startsWith('<')) {
      return {
        contentWithoutImages: removeImagesFromHtml(item.content),
        images: extractImagesFromHtml(item.content),
      };
    }
    return { contentWithoutImages: item.content || '', images: [] };
  }, [item.type, item.content]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(item.id, item.source);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment(item.id, item.source);
  };

  // QT 콘텐츠 렌더링 - 심플하게
  const renderQTContent = () => {
    const sections = [];

    if (item.mySentence) {
      sections.push(
        <p key="sentence" className="text-[15px] leading-relaxed">
          <span className="font-semibold">한 문장</span>{' '}
          {item.mySentence}
        </p>
      );
    }

    if (item.meditationAnswer) {
      sections.push(
        <p key="answer" className="text-[15px] leading-relaxed">
          <span className="font-semibold">묵상</span>{' '}
          {item.meditationAnswer}
        </p>
      );
    }

    if (item.gratitude) {
      sections.push(
        <p key="gratitude" className="text-[15px] leading-relaxed">
          <span className="font-semibold">감사</span>{' '}
          {item.gratitude}
        </p>
      );
    }

    if (item.myPrayer) {
      sections.push(
        <p key="prayer" className="text-[15px] leading-relaxed">
          <span className="font-semibold">기도</span>{' '}
          {item.myPrayer}
        </p>
      );
    }

    if (item.dayReview) {
      sections.push(
        <p key="review" className="text-[15px] leading-relaxed">
          <span className="font-semibold">하루 점검</span>{' '}
          {item.dayReview}
        </p>
      );
    }

    return sections.length > 0 ? (
      <div className="space-y-3">{sections}</div>
    ) : null;
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (item.type === 'meditation') {
      if (item.content?.startsWith('<')) {
        return <RichViewerWithEmbed content={contentWithoutImages} className="text-[15px] leading-relaxed" />;
      }
      return <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{item.content}</p>;
    }
    return renderQTContent();
  };

  return (
    <article
      className="bg-background border-b border-border/50 cursor-pointer"
      onClick={() => onViewDetail?.(item)}
    >
      <div className="px-4 py-3">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          {/* 아바타 - 심플한 원형 */}
          <button
            className="shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              if (!item.isAnonymous) onAuthorClick?.(item.authorId);
            }}
          >
            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center overflow-hidden`}>
              {item.authorAvatarUrl && !item.isAnonymous ? (
                <Image
                  src={item.authorAvatarUrl}
                  alt={displayName}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-white font-semibold text-sm">{initials}</span>
              )}
            </div>
          </button>

          {/* 사용자 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                className="font-semibold text-[14px] hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.isAnonymous) onAuthorClick?.(item.authorId);
                }}
              >
                {displayName}
              </button>
              <span className="text-muted-foreground text-[13px]">
                · {formatRelativeTime(item.createdAt)}
              </span>
            </div>

            {/* 소스 정보 - 미니멀 */}
            {showSource && (
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                {item.source === 'church' && (
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.churchCode) onChurchClick?.(item.churchCode);
                      else onSourceClick?.(item.source, item.sourceId);
                    }}
                  >
                    <Church className="w-3 h-3" />
                    {item.churchName || item.sourceName}
                  </button>
                )}
                {item.source === 'group' && (
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSourceClick?.(item.source, item.sourceId);
                    }}
                  >
                    <Users className="w-3 h-3" />
                    {item.sourceName}
                  </button>
                )}
                {item.dayNumber && (
                  <>
                    <span>·</span>
                    <span>{item.dayNumber}일차</span>
                  </>
                )}
                {item.type === 'qt' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <BookOpen className="w-3 h-3" />
                      QT
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 더보기 메뉴 */}
          {isOwner && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 -mr-2 hover:bg-muted/50 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="mb-3">
          {renderContent()}
        </div>

        {/* 이미지 */}
        {images.length > 0 && (
          <div className="-mx-4 mb-3">
            {images.length === 1 ? (
              <div
                className="relative aspect-square max-h-[500px] cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(images[0], '_blank');
                }}
              >
                <Image
                  src={images[0]}
                  alt="첨부 이미지"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {images.slice(0, 4).map((src, index) => (
                  <div
                    key={index}
                    className="relative aspect-square cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(src, '_blank');
                    }}
                  >
                    <Image
                      src={src}
                      alt={`이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 인터랙션 - Instagram 스타일 */}
        {variant !== 'minimal' && (
          <div className="space-y-2">
            {/* 아이콘 버튼 */}
            <div className="flex items-center gap-4 -ml-2">
              <button
                className="p-2 active:scale-90 transition-transform"
                onClick={handleLike}
              >
                <Heart
                  className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                />
              </button>
              <button
                className="p-2 active:scale-90 transition-transform"
                onClick={handleComment}
              >
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>

            {/* 좋아요/댓글 수 */}
            {(likesCount > 0 || item.repliesCount > 0) && (
              <div className="space-y-1">
                {likesCount > 0 && (
                  <p className="font-semibold text-[14px]">좋아요 {likesCount}개</p>
                )}
                {item.repliesCount > 0 && (
                  <button
                    className="text-muted-foreground text-[14px]"
                    onClick={handleComment}
                  >
                    댓글 {item.repliesCount}개 모두 보기
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

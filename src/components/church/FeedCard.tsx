'use client';

/**
 * FeedCard 컴포넌트
 *
 * @deprecated UnifiedFeedCard 사용을 권장합니다.
 * 이 컴포넌트는 하위 호환성을 위해 UnifiedFeedCard의 래퍼로 유지됩니다.
 */

import { UnifiedFeedCard, type UnifiedFeedItem, type FeedSource } from '@/components/feed/UnifiedFeedCard';
import type { QTDailyContent } from '@/types';

// 피드 아이템 타입 (기존 인터페이스 유지)
export type FeedItemType = 'meditation' | 'qt';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  authorName: string;
  isAnonymous: boolean;
  visibility?: string;
  createdAt: string;
  dayNumber?: number | null;
  bibleRange?: string | null;
  // 짧은 묵상용
  content?: string;
  // QT용
  qtDate?: string;
  mySentence?: string | null;
  meditationAnswer?: string | null;
  meditationQuestion?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  // 인터랙션
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  userId?: string | null;
  // 출처 정보 (통합 테이블용)
  sourceType?: 'group' | 'church';
  sourceName?: string;
  // 레거시 테이블 매핑 (좋아요/답글용)
  legacyId?: string | null;
  legacyTable?: string | null;
}

interface FeedCardProps {
  item: FeedItem;
  currentUserId?: string | null;
  qtContent?: QTDailyContent | null;
  onLike: (id: string, type: FeedItemType) => void;
  onComment: (id: string, type: FeedItemType) => void;
  onEdit?: (item: FeedItem) => void;
  onDelete?: (item: FeedItem) => void;
  onViewDetail?: (item: FeedItem) => void;
  onAuthorClick?: (authorId: string) => void;
  authorAvatarUrl?: string | null;
}

/**
 * FeedItem → UnifiedFeedItem 변환
 */
export function toUnifiedItem(item: FeedItem, authorAvatarUrl?: string | null, churchCode?: string): UnifiedFeedItem {
  return {
    id: item.id,
    type: item.type,
    source: (item.sourceType as FeedSource) ?? 'church',
    sourceName: item.sourceName,
    authorId: item.userId ?? '',
    authorName: item.authorName,
    authorAvatarUrl: authorAvatarUrl,
    isAnonymous: item.isAnonymous,
    createdAt: item.createdAt,
    dayNumber: item.dayNumber,
    bibleRange: item.bibleRange,
    content: item.content,
    qtDate: item.qtDate,
    mySentence: item.mySentence,
    meditationAnswer: item.meditationAnswer,
    meditationQuestion: item.meditationQuestion,
    gratitude: item.gratitude,
    myPrayer: item.myPrayer,
    dayReview: item.dayReview,
    likesCount: item.likesCount,
    repliesCount: item.repliesCount,
    isLiked: item.isLiked,
    churchCode: churchCode,
  };
}

/**
 * UnifiedFeedItem → FeedItem 역변환
 */
function toFeedItem(item: UnifiedFeedItem): FeedItem {
  return {
    id: item.id,
    type: item.type,
    authorName: item.authorName,
    isAnonymous: item.isAnonymous,
    createdAt: item.createdAt,
    dayNumber: item.dayNumber,
    bibleRange: item.bibleRange,
    content: item.content,
    qtDate: item.qtDate,
    mySentence: item.mySentence,
    meditationAnswer: item.meditationAnswer,
    meditationQuestion: item.meditationQuestion,
    gratitude: item.gratitude,
    myPrayer: item.myPrayer,
    dayReview: item.dayReview,
    likesCount: item.likesCount,
    repliesCount: item.repliesCount,
    isLiked: item.isLiked,
    userId: item.authorId,
    sourceType: item.source === 'personal' ? undefined : item.source,
    sourceName: item.sourceName,
  };
}

/**
 * @deprecated UnifiedFeedCard 사용을 권장합니다.
 */
export function FeedCard({
  item,
  currentUserId,
  qtContent,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onViewDetail,
  onAuthorClick,
  authorAvatarUrl,
}: FeedCardProps) {
  const unifiedItem = toUnifiedItem(item, authorAvatarUrl);

  return (
    <UnifiedFeedCard
      item={unifiedItem}
      currentUserId={currentUserId}
      qtContent={qtContent}
      variant="compact"
      showSource={false}
      onLike={(id) => onLike(id, item.type)}
      onComment={(id) => onComment(id, item.type)}
      onEdit={onEdit ? (unified) => onEdit(toFeedItem(unified)) : undefined}
      onDelete={onDelete ? (unified) => onDelete(toFeedItem(unified)) : undefined}
      onViewDetail={onViewDetail ? (unified) => onViewDetail(toFeedItem(unified)) : undefined}
      onAuthorClick={onAuthorClick}
    />
  );
}

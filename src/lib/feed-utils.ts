/**
 * 피드 카드 공통 유틸리티
 *
 * 여러 피드 카드 컴포넌트에서 공유하는 로직을 추출하여 중복을 제거합니다.
 */

import { useState, useCallback } from 'react';
import type { FeedItem, FeedItemType } from '@/components/church/FeedCard';
import type { UnifiedFeedItem, FeedSource } from '@/components/feed/UnifiedFeedCard';

// 이미지 추출/제거 함수는 rich-editor.tsx에서 import
export { extractImagesFromHtml, removeImagesFromHtml } from '@/components/ui/rich-editor';

/**
 * 좋아요 상태 및 애니메이션 관리 훅
 */
export function useLikeState(initialLiked: boolean, initialCount: number) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likesCount, setLikesCount] = useState(initialCount);

  const handleLike = useCallback((onLike: () => void) => {
    setIsAnimating(true);
    setIsLiked(prev => !prev);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
    setTimeout(() => setIsAnimating(false), 300);
  }, [isLiked]);

  return {
    isLiked,
    isAnimating,
    likesCount,
    handleLike,
  };
}

/**
 * FeedItem → UnifiedFeedItem 변환
 *
 * 기존 FeedCard에서 사용하던 FeedItem을 UnifiedFeedItem으로 변환합니다.
 * 교회 피드에서 사용할 때 source='church'로 설정합니다.
 */
export function feedItemToUnifiedItem(
  item: FeedItem,
  options?: {
    source?: FeedSource;
    sourceName?: string;
    sourceId?: string;
    authorAvatarUrl?: string | null;
  }
): UnifiedFeedItem {
  return {
    id: item.id,
    type: item.type,
    source: options?.source ?? (item.sourceType as FeedSource) ?? 'church',
    sourceName: options?.sourceName ?? item.sourceName,
    sourceId: options?.sourceId,
    authorId: item.userId ?? '',
    authorName: item.authorName,
    authorAvatarUrl: options?.authorAvatarUrl,
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
  };
}

/**
 * UnifiedFeedItem → FeedItem 변환 (역변환)
 *
 * UnifiedFeedItem을 기존 FeedItem 형식으로 변환합니다.
 * 기존 컴포넌트와의 호환성을 위해 사용합니다.
 */
export function unifiedItemToFeedItem(item: UnifiedFeedItem): FeedItem {
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
 * 콘텐츠에서 이미지와 텍스트 분리
 */
export function separateContentAndImages(content: string | undefined) {
  // 동적 import를 피하기 위해 여기서 직접 구현하지 않고
  // 호출하는 쪽에서 extractImagesFromHtml, removeImagesFromHtml 사용
  if (!content?.startsWith('<')) {
    return { contentWithoutImages: content || '', images: [] };
  }

  // HTML 콘텐츠인 경우 caller가 직접 처리
  return null;
}

/**
 * 좋아요 카운트 포맷팅
 */
export function formatLikeCount(count: number): string {
  if (count === 0) return '';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

/**
 * 인터랙션 요약 텍스트 생성
 */
export function getInteractionSummary(likesCount: number, repliesCount: number): string {
  const parts: string[] = [];
  if (likesCount > 0) {
    parts.push(`${likesCount}명이 공감`);
  }
  if (repliesCount > 0) {
    parts.push(`댓글 ${repliesCount}개`);
  }
  return parts.join(' · ');
}

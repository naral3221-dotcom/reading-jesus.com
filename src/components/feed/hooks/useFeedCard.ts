'use client';

/**
 * useFeedCard Hook
 *
 * 피드 카드 컴포넌트의 공통 로직을 추출한 훅입니다.
 * UnifiedFeedCard와 PublicFeedCard에서 공통으로 사용됩니다.
 */

import { useState, useMemo, useCallback } from 'react';
import { extractImagesFromHtml, removeImagesFromHtml } from '@/components/ui/rich-editor';
import { getInitials, getAvatarColor } from '@/lib/date-utils';

export interface BaseFeedItem {
  id: string;
  type: 'meditation' | 'qt';
  authorName: string;
  authorAvatarUrl?: string | null;
  isAnonymous: boolean;
  createdAt: string;
  content?: string;
  mySentence?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
}

interface UseFeedCardOptions {
  item: BaseFeedItem;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

interface UseFeedCardReturn {
  // 상태
  isLiked: boolean;
  likesCount: number;
  // 파생 값
  displayName: string;
  avatarColor: string;
  initials: string;
  contentWithoutImages: string;
  images: string[];
  // 핸들러
  handleLikeClick: (e: React.MouseEvent) => void;
  handleCommentClick: (e: React.MouseEvent) => void;
  // QT 섹션 데이터
  qtSections: Array<{ key: string; label: string; value: string }>;
  // 콘텐츠 타입
  isHtmlContent: boolean;
}

export function useFeedCard({
  item,
  isLoggedIn = true,
  onLoginRequired,
}: UseFeedCardOptions): UseFeedCardReturn {
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);

  // 파생 값 계산
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

  // HTML 콘텐츠인지 확인
  const isHtmlContent = Boolean(item.type === 'meditation' && item.content?.startsWith('<'));

  // QT 섹션 데이터 생성
  const qtSections = useMemo(() => {
    const sections: Array<{ key: string; label: string; value: string }> = [];

    if (item.mySentence) {
      sections.push({ key: 'sentence', label: '한 문장', value: item.mySentence });
    }
    if (item.meditationAnswer) {
      sections.push({ key: 'answer', label: '묵상', value: item.meditationAnswer });
    }
    if (item.gratitude) {
      sections.push({ key: 'gratitude', label: '감사', value: item.gratitude });
    }
    if (item.myPrayer) {
      sections.push({ key: 'prayer', label: '기도', value: item.myPrayer });
    }
    if (item.dayReview) {
      sections.push({ key: 'review', label: '하루 점검', value: item.dayReview });
    }

    return sections;
  }, [item.mySentence, item.meditationAnswer, item.gratitude, item.myPrayer, item.dayReview]);

  // 좋아요 클릭 핸들러 (로그인 체크 포함)
  const handleLikeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        onLoginRequired?.();
        return;
      }
      setIsLiked((prev) => !prev);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    },
    [isLoggedIn, isLiked, onLoginRequired]
  );

  // 댓글 클릭 핸들러 (로그인 체크 포함)
  const handleCommentClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLoggedIn) {
        onLoginRequired?.();
        return;
      }
    },
    [isLoggedIn, onLoginRequired]
  );

  return {
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
  };
}

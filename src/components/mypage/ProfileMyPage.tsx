'use client';

/**
 * Instagram 스타일 프로필 마이페이지
 *
 * 인스타그램 프로필 페이지 스타일의 새로운 마이페이지입니다.
 * - 상단: 프로필 헤더 (아바타, 통계)
 * - 중단: 탭 네비게이션 (내 묵상, 좋아요, 북마크)
 * - 하단: 그리드 피드
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { FeedDetailModal } from '@/components/feed/FeedDetailModal';

import { InstagramProfileHeader } from './profile';
import { ProfileTabs, type ProfileTabType } from './tabs';
import { ProfileGridFeed } from './grid';
import { IntegratedStatsSection } from './IntegratedStatsSection';

import { useUserMeditations } from '@/presentation/hooks/queries/useUnifiedMeditation';
import { useUserPersonalMeditations } from '@/presentation/hooks/queries/usePublicMeditation';
import { useUserLikedMeditations } from '@/presentation/hooks/queries/useUserLikedMeditations';
import { useUserBookmarks } from '@/presentation/hooks/queries/useUserBookmarks';

import type { ChurchContext, GridFeedItem, MyPageStats, IntegratedStats } from '@/types';
import type { UnifiedFeedItem } from '@/components/feed/UnifiedFeedCard';

interface ProfileMyPageProps {
  // 사용자 정보
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  // 통계
  stats: MyPageStats;
  meditationCount: number;
  integratedStats?: IntegratedStats | null; // 통합 통계 (메인 마이페이지용)
  // 컨텍스트
  churchContext?: ChurchContext | null;
  isRegisteredMember?: boolean;
  // 액션
  onLogout: () => void;
  // 탭 위에 배치할 추가 섹션들
  children?: React.ReactNode;
}

export function ProfileMyPage({
  userId,
  nickname,
  avatarUrl,
  isAnonymous,
  stats,
  meditationCount,
  integratedStats,
  churchContext,
  isRegisteredMember = false,
  onLogout,
  children,
}: ProfileMyPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isChurchContext = !!churchContext;

  // 탭 상태
  const [activeTab, setActiveTab] = useState<ProfileTabType>('posts');

  // 선택된 아이템 (모달용)
  const [selectedItem, setSelectedItem] = useState<GridFeedItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 데이터 조회 - 그룹/교회 묵상 (unified_meditations)
  const { data: unifiedMeditations = [], isLoading: loadingUnified } = useUserMeditations(
    userId,
    { enabled: !isAnonymous }
  );

  // 개인 프로젝트 묵상 (public_meditations)
  const { data: personalMeditations = [], isLoading: loadingPersonal } = useUserPersonalMeditations(
    userId,
    { enabled: !isAnonymous }
  );

  const { data: likedMeditations = [], isLoading: loadingLiked } = useUserLikedMeditations(
    userId,
    { enabled: !isAnonymous && activeTab === 'liked' }
  );

  const { data: bookmarkedMeditations = [], isLoading: loadingBookmarks } = useUserBookmarks(
    userId,
    { enabled: !isAnonymous && activeTab === 'bookmarks' }
  );

  const loadingMeditations = loadingUnified || loadingPersonal;

  // contentType 변환 헬퍼 (free -> meditation)
  const convertContentType = (contentType: string): 'meditation' | 'qt' => {
    return contentType === 'qt' ? 'qt' : 'meditation';
  };

  // 내 묵상을 GridFeedItem으로 변환 (그룹/교회 + 개인 프로젝트 통합)
  const myGridItems: GridFeedItem[] = useMemo(() => {
    // 1. 그룹/교회 묵상 (unified_meditations)
    const unifiedItems: GridFeedItem[] = unifiedMeditations.map((m): GridFeedItem => {
      // 썸네일 추출
      let thumbnailUrl: string | null = null;
      if (m.content) {
        const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
          thumbnailUrl = imgMatch[1];
        }
      }

      // 텍스트 미리보기
      const textPreview = getTextPreview({
        contentType: convertContentType(m.contentType),
        content: m.content,
        mySentence: m.mySentence,
        meditationAnswer: m.meditationAnswer,
        gratitude: m.gratitude,
        myPrayer: m.myPrayer,
        dayReview: m.dayReview,
      });

      return {
        id: m.id,
        type: convertContentType(m.contentType),
        source: m.sourceType,
        sourceId: m.sourceId,
        sourceName: m.sourceName,
        thumbnailUrl,
        textPreview,
        likesCount: m.likesCount,
        repliesCount: m.repliesCount,
        dayNumber: m.dayNumber,
        bibleRange: m.bibleRange,
        qtDate: m.qtDate ? m.qtDate.toISOString().split('T')[0] : null,
        createdAt: m.createdAt.toISOString(),
        fullData: {
          authorId: m.userId || '',
          authorName: m.authorName,
          authorAvatarUrl: m.profile?.avatarUrl,
          isAnonymous: m.isAnonymous,
          content: m.content ?? undefined,
          mySentence: m.mySentence,
          meditationAnswer: m.meditationAnswer,
          gratitude: m.gratitude,
          myPrayer: m.myPrayer,
          dayReview: m.dayReview,
        },
      };
    });

    // 2. 개인 프로젝트 묵상 (public_meditations)
    const personalItems: GridFeedItem[] = personalMeditations.map((m): GridFeedItem => {
      // 썸네일 추출
      let thumbnailUrl: string | null = null;
      if (m.content) {
        const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
          thumbnailUrl = imgMatch[1];
        }
      }

      // 텍스트 미리보기
      const textPreview = getTextPreview({
        contentType: m.meditationType === 'qt' ? 'qt' : 'meditation',
        content: m.content,
        mySentence: m.oneWord, // PublicMeditation에서는 oneWord가 mySentence 역할
        meditationAnswer: m.meditationAnswer,
        gratitude: m.gratitude,
        myPrayer: m.myPrayer,
        dayReview: m.dayReview,
      });

      return {
        id: m.id,
        type: m.meditationType === 'qt' ? 'qt' : 'meditation',
        source: 'personal' as const,
        sourceId: m.projectId ?? undefined,
        sourceName: '개인 묵상',
        thumbnailUrl,
        textPreview,
        likesCount: m.likesCount,
        repliesCount: m.repliesCount,
        dayNumber: m.dayNumber,
        bibleRange: m.bibleReference, // bibleReference → bibleRange로 매핑
        qtDate: null,
        createdAt: m.createdAt.toISOString(),
        fullData: {
          authorId: m.userId,
          authorName: m.profile?.nickname ?? '익명',
          authorAvatarUrl: m.profile?.avatarUrl,
          isAnonymous: m.isAnonymous,
          content: m.content ?? undefined,
          mySentence: m.oneWord,
          meditationAnswer: m.meditationAnswer,
          gratitude: m.gratitude,
          myPrayer: m.myPrayer,
          dayReview: m.dayReview,
        },
      };
    });

    // 3. 합치고 시간순 정렬 (최신순)
    return [...unifiedItems, ...personalItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [unifiedMeditations, personalMeditations]);

  // 현재 탭의 데이터
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'posts':
        return myGridItems;
      case 'liked':
        return likedMeditations;
      case 'bookmarks':
        return bookmarkedMeditations;
      default:
        return [];
    }
  }, [activeTab, myGridItems, likedMeditations, bookmarkedMeditations]);

  const isLoading = useMemo(() => {
    switch (activeTab) {
      case 'posts':
        return loadingMeditations;
      case 'liked':
        return loadingLiked;
      case 'bookmarks':
        return loadingBookmarks;
      default:
        return false;
    }
  }, [activeTab, loadingMeditations, loadingLiked, loadingBookmarks]);

  // 탭별 카운트
  const tabCounts = useMemo(
    () => ({
      posts: myGridItems.length,
      liked: likedMeditations.length,
      bookmarks: bookmarkedMeditations.length,
    }),
    [myGridItems.length, likedMeditations.length, bookmarkedMeditations.length]
  );

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((item: GridFeedItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  }, []);

  // 프로필 수정
  const handleEditProfile = useCallback(() => {
    const basePath = isChurchContext && churchContext?.churchCode
      ? `/church/${churchContext.churchCode}/my`
      : '/mypage';
    router.push(`${basePath}/profile`);
  }, [router, isChurchContext, churchContext?.churchCode]);

  // 빈 상태 메시지
  const getEmptyMessage = (tab: ProfileTabType): string => {
    switch (tab) {
      case 'posts':
        return '아직 작성한 묵상이 없습니다';
      case 'liked':
        return '좋아요한 묵상이 없습니다';
      case 'bookmarks':
        return '북마크한 묵상이 없습니다';
      default:
        return '데이터가 없습니다';
    }
  };

  // 빈 상태 아이콘
  const getEmptyIcon = (tab: ProfileTabType) => {
    switch (tab) {
      case 'posts':
        return <FileText className="w-12 h-12 opacity-50" />;
      case 'liked':
        return <Heart className="w-12 h-12 opacity-50" />;
      case 'bookmarks':
        return <Bookmark className="w-12 h-12 opacity-50" />;
      default:
        return null;
    }
  };

  // GridFeedItem을 UnifiedFeedItem으로 변환 (모달용)
  const toUnifiedFeedItem = (item: GridFeedItem): UnifiedFeedItem | null => {
    if (!item.fullData) return null;

    return {
      id: item.id,
      type: item.type,
      source: item.source,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      authorId: item.fullData.authorId,
      authorName: item.fullData.authorName,
      authorAvatarUrl: item.fullData.authorAvatarUrl,
      isAnonymous: item.fullData.isAnonymous,
      createdAt: item.createdAt,
      dayNumber: item.dayNumber,
      bibleRange: item.bibleRange,
      qtDate: item.qtDate ?? undefined,
      content: item.fullData.content,
      mySentence: item.fullData.mySentence,
      meditationAnswer: item.fullData.meditationAnswer,
      gratitude: item.fullData.gratitude,
      myPrayer: item.fullData.myPrayer,
      dayReview: item.fullData.dayReview,
      likesCount: item.likesCount,
      repliesCount: item.repliesCount,
      churchName: item.fullData.churchName,
      churchCode: item.fullData.churchCode,
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full">
      {/* 프로필 헤더 */}
      <InstagramProfileHeader
        nickname={nickname}
        avatarUrl={avatarUrl}
        isAnonymous={isAnonymous}
        stats={{
          meditationCount: myGridItems.length, // QT + 묵상 개수 합계
          completedDays: stats.completedDays,
          currentStreak: stats.currentStreak,
        }}
        isChurchContext={isChurchContext}
        churchCode={churchContext?.churchCode}
        churchName={churchContext?.church.name}
        isRegisteredMember={isRegisteredMember}
        onEditProfile={handleEditProfile}
        onLogout={onLogout}
      />

      {/* 추가 섹션들 (소속 교회, 개인 프로젝트 등) */}
      {children && (
        <div className="px-4 py-3 space-y-4">
          {children}
        </div>
      )}

      {/* 활동별 현황 (메인 마이페이지에서만, 탭 바로 위) - 교회 활동은 소속 교회 섹션에 통합 표시 */}
      {!isChurchContext && integratedStats && integratedStats.activities.length > 0 && (
        <div className="px-4 pb-3">
          <IntegratedStatsSection stats={integratedStats} excludeChurch />
        </div>
      )}

      {/* 탭 네비게이션 */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={tabCounts}
      />

      {/* 그리드 피드 */}
      <div className="flex-1">
        <ProfileGridFeed
          items={currentItems}
          isLoading={isLoading}
          onItemClick={handleItemClick}
          emptyMessage={getEmptyMessage(activeTab)}
          emptyIcon={getEmptyIcon(activeTab)}
        />
      </div>
      </div>

      {/* 상세 모달 */}
      {selectedItem && (
        <FeedDetailModal
          item={toUnifiedFeedItem(selectedItem)}
          open={detailModalOpen}
          onOpenChange={(open) => {
            setDetailModalOpen(open);
            if (!open) setSelectedItem(null);
          }}
          currentUserId={userId}
          onLike={() => {
            toast({
              title: '좋아요',
              description: '좋아요를 눌렀습니다',
            });
          }}
        />
      )}
    </div>
  );
}

/**
 * 텍스트 미리보기 생성
 */
function getTextPreview(meditation: {
  contentType: 'meditation' | 'qt';
  content?: string | null;
  mySentence?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
}): string {
  if (meditation.contentType === 'qt') {
    if (meditation.mySentence) return stripHtml(meditation.mySentence);
    if (meditation.meditationAnswer) return stripHtml(meditation.meditationAnswer);
    if (meditation.myPrayer) return stripHtml(meditation.myPrayer);
    if (meditation.gratitude) return stripHtml(meditation.gratitude);
    if (meditation.dayReview) return stripHtml(meditation.dayReview);
  }

  if (meditation.content) {
    return stripHtml(meditation.content);
  }

  return '내용 없음';
}

/**
 * HTML 태그 제거
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .slice(0, 100);
}

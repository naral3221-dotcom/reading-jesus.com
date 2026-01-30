'use client';

/**
 * User Public Profile Page - 인스타그램 스타일 공개 프로필 페이지
 *
 * 다른 사용자의 프로필과 공개 묵상을 볼 수 있는 페이지입니다.
 * - 프로필 정보 (아바타, 닉네임, 소속 교회)
 * - 통계 (묵상 수, 팔로워, 팔로잉)
 * - 팔로우/언팔로우 기능
 * - 그리드 형태의 묵상 피드
 */

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, User, FileText, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { PublicProfileHeader } from '@/components/mypage/profile';
import { ProfileGridFeed } from '@/components/mypage/grid';
import { FeedDetailModal } from '@/components/feed/FeedDetailModal';
import { FollowersList } from '@/components/profile';

import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import {
  useUserWithFollowStatus,
  useToggleFollow,
} from '@/presentation/hooks/queries/useUserFollow';
import {
  useUserPersonalMeditations,
  useTogglePublicMeditationLike,
} from '@/presentation/hooks/queries/usePublicMeditation';
import { useUserMeditations } from '@/presentation/hooks/queries/useUnifiedMeditation';
import { useToast } from '@/components/ui/toast';

import type { GridFeedItem } from '@/types';
import type { UnifiedFeedItem } from '@/components/feed/UnifiedFeedCard';

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const targetUserId = params.userId as string;

  // 팔로워/팔로잉 목록 모달
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersMode, setFollowersMode] = useState<'followers' | 'following'>('followers');

  // 상세 모달
  const [selectedItem, setSelectedItem] = useState<GridFeedItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 현재 로그인한 사용자
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const currentUserId = userData?.user?.id ?? null;
  const isOwnProfile = currentUserId === targetUserId;

  // 대상 사용자 정보 + 팔로우 상태
  const {
    data: targetUser,
    isLoading: targetLoading,
  } = useUserWithFollowStatus(targetUserId, currentUserId ?? undefined);

  // 대상 사용자의 묵상 - 마이페이지와 동일하게 두 데이터 소스에서 가져옴
  // 1. unified_meditations - 그룹/교회 묵상
  const { data: unifiedMeditations = [], isLoading: loadingUnified } = useUserMeditations(
    targetUserId,
    { enabled: true }
  );

  // 2. public_meditations - 개인 프로젝트 묵상
  const { data: personalMeditations = [], isLoading: loadingPersonal } = useUserPersonalMeditations(
    targetUserId,
    { enabled: true }
  );

  const meditationsLoading = loadingUnified || loadingPersonal;

  // 팔로우 토글
  const { toggle: toggleFollow, isLoading: followLoading } = useToggleFollow();

  // 좋아요 토글
  const toggleLikeMutation = useTogglePublicMeditationLike();

  // 팔로우/언팔로우 핸들러
  const handleFollow = async () => {
    if (!currentUserId) {
      toast({
        title: '로그인이 필요합니다',
        variant: 'error',
      });
      router.push('/login');
      return;
    }

    try {
      await toggleFollow(currentUserId, targetUserId, false);
      toast({ title: '팔로우했습니다' });
    } catch {
      toast({
        title: '팔로우에 실패했습니다',
        variant: 'error',
      });
    }
  };

  const handleUnfollow = async () => {
    if (!currentUserId) return;

    try {
      await toggleFollow(currentUserId, targetUserId, true);
      toast({ title: '팔로우를 취소했습니다' });
    } catch {
      toast({
        title: '팔로우 취소에 실패했습니다',
        variant: 'error',
      });
    }
  };

  // 팔로워/팔로잉 목록 열기
  const openFollowersList = (mode: 'followers' | 'following') => {
    setFollowersMode(mode);
    setFollowersOpen(true);
  };

  // contentType 변환 헬퍼 (free -> meditation)
  const convertContentType = (contentType: string): 'meditation' | 'qt' => {
    return contentType === 'qt' ? 'qt' : 'meditation';
  };

  // 묵상 데이터를 GridFeedItem으로 변환 (unified + personal 통합)
  const gridItems: GridFeedItem[] = useMemo(() => {
    // 1. 그룹/교회 묵상 (unified_meditations)
    const unifiedItems: GridFeedItem[] = unifiedMeditations.map((m): GridFeedItem => {
      let thumbnailUrl: string | null = null;
      if (m.content) {
        const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
          thumbnailUrl = imgMatch[1];
        }
      }

      const textPreview = getTextPreview({
        meditationType: convertContentType(m.contentType),
        content: m.content,
        oneWord: m.mySentence,
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
          authorAvatarUrl: m.profile?.avatarUrl || targetUser?.avatarUrl,
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
      let thumbnailUrl: string | null = null;
      if (m.content) {
        const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
          thumbnailUrl = imgMatch[1];
        }
      }

      const textPreview = getTextPreview({
        meditationType: m.meditationType === 'qt' ? 'qt' : 'meditation',
        content: m.content,
        oneWord: m.oneWord,
        meditationAnswer: m.meditationAnswer,
        gratitude: m.gratitude,
        myPrayer: m.myPrayer,
        dayReview: m.dayReview,
      });

      return {
        id: m.id,
        type: m.meditationType === 'qt' ? 'qt' : 'meditation',
        source: 'personal',
        sourceId: m.projectId || '',
        sourceName: '개인 묵상',
        thumbnailUrl,
        textPreview,
        likesCount: m.likesCount || 0,
        repliesCount: m.repliesCount || 0,
        dayNumber: m.dayNumber,
        bibleRange: m.bibleReference,
        qtDate: null,
        createdAt: m.createdAt.toISOString(),
        fullData: {
          authorId: m.userId,
          authorName: m.profile?.nickname || targetUser?.nickname || '익명',
          authorAvatarUrl: m.profile?.avatarUrl || targetUser?.avatarUrl,
          isAnonymous: m.isAnonymous || false,
          content: m.content,
          mySentence: m.oneWord,
          meditationAnswer: m.meditationAnswer,
          gratitude: m.gratitude,
          myPrayer: m.myPrayer,
          dayReview: m.dayReview,
        },
      };
    });

    // 3. 통합 후 시간순 정렬 (최신순)
    const allItems = [...unifiedItems, ...personalItems];
    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return allItems;
  }, [unifiedMeditations, personalMeditations, targetUser]);

  // 아이템 클릭 핸들러
  const handleItemClick = useCallback((item: GridFeedItem) => {
    setSelectedItem(item);
    setDetailModalOpen(true);
  }, []);

  // 좋아요 핸들러
  const handleLike = async (meditationId: string) => {
    if (!currentUserId) {
      toast({
        title: '로그인이 필요합니다',
        variant: 'error',
      });
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync({
        meditationId,
        userId: currentUserId,
      });
    } catch {
      toast({
        title: '좋아요 처리에 실패했습니다',
        variant: 'error',
      });
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

  const isLoading = userLoading || targetLoading;

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 사용자를 찾을 수 없음
  if (!targetUser) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center px-4 py-2 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <span className="sr-only">뒤로</span>
            ←
          </Button>
          <h1 className="text-base font-semibold ml-2">프로필</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8">
          <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold mb-2">사용자를 찾을 수 없습니다</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            요청하신 프로필이 존재하지 않거나 삭제되었을 수 있습니다.
          </p>
          <Button variant="outline" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full">
        {/* 프로필 헤더 */}
        <PublicProfileHeader
          userId={targetUserId}
          nickname={targetUser.nickname || '익명'}
          avatarUrl={targetUser.avatarUrl}
          stats={{
            meditationCount: gridItems.length,
            followersCount: targetUser.followersCount ?? 0,
            followingCount: targetUser.followingCount ?? 0,
          }}
          churchName={targetUser.churchName}
          churchCode={targetUser.churchCode}
          isFollowing={targetUser.isFollowing ?? false}
          isOwnProfile={isOwnProfile}
          isFollowLoading={followLoading}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onFollowersClick={() => openFollowersList('followers')}
          onFollowingClick={() => openFollowersList('following')}
        />

        {/* 탭 구분선 (묵상 그리드만 표시) */}
        <div className="border-t border-b bg-background">
          <div className="flex">
            <div className="flex-1 flex flex-col items-center justify-center py-3 text-foreground border-b-2 border-foreground">
              <Grid3x3 className="w-6 h-6" />
              <span className="text-[10px] mt-1 hidden sm:block">
                묵상 ({gridItems.length})
              </span>
            </div>
          </div>
        </div>

        {/* 묵상 그리드 피드 */}
        <div className="flex-1">
          <ProfileGridFeed
            items={gridItems}
            isLoading={meditationsLoading}
            hasMore={false}
            onLoadMore={() => {}}
            onItemClick={handleItemClick}
            emptyMessage="아직 작성된 묵상이 없습니다"
            emptyIcon={<FileText className="w-12 h-12 opacity-50" />}
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
          currentUserId={currentUserId}
          onLike={() => {
            if (selectedItem) {
              handleLike(selectedItem.id);
            }
          }}
        />
      )}

      {/* 팔로워/팔로잉 목록 모달 */}
      <FollowersList
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        userId={targetUserId}
        currentUserId={currentUserId}
        mode={followersMode}
      />
    </div>
  );
}

/**
 * 텍스트 미리보기 생성
 */
function getTextPreview(meditation: {
  meditationType?: string;
  content?: string | null;
  oneWord?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
}): string {
  if (meditation.meditationType === 'qt') {
    if (meditation.oneWord) return stripHtml(meditation.oneWord);
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

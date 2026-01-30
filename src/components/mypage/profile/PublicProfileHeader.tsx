'use client';

/**
 * PublicProfileHeader - 다른 사용자의 프로필 헤더
 *
 * 인스타그램 스타일의 공개 프로필 헤더 컴포넌트입니다.
 * - 아바타, 닉네임
 * - 묵상 수, 팔로워, 팔로잉 통계
 * - 팔로우/언팔로우 버튼
 * - 소속 교회 정보
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Church, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getInitials, getAvatarColor } from '@/lib/date-utils';
import { ProfileStatItem } from './ProfileStatItem';

interface PublicProfileStats {
  meditationCount: number;
  followersCount: number;
  followingCount: number;
}

interface PublicProfileHeaderProps {
  // 사용자 정보
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  // 통계
  stats: PublicProfileStats;
  // 소속 교회
  churchName?: string | null;
  churchCode?: string | null;
  // 팔로우 상태
  isFollowing: boolean;
  isOwnProfile: boolean;
  isFollowLoading?: boolean;
  // 액션
  onFollow: () => void;
  onUnfollow: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onShare?: () => void;
}

export function PublicProfileHeader({
  userId,
  nickname,
  avatarUrl,
  stats,
  churchName,
  churchCode,
  isFollowing,
  isOwnProfile,
  isFollowLoading = false,
  onFollow,
  onUnfollow,
  onFollowersClick,
  onFollowingClick,
  onShare,
}: PublicProfileHeaderProps) {
  const router = useRouter();

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // 기본 공유 기능
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname}의 프로필`,
          text: `${nickname}님의 성경읽기 프로필을 확인해보세요`,
          url: window.location.href,
        });
      } catch {
        // 사용자가 취소한 경우
      }
    }
  };

  const handleChurchClick = () => {
    if (churchCode) {
      router.push(`/church/${churchCode}`);
    }
  };

  return (
    <div className="bg-background">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <h1 className="text-base font-semibold">{nickname}</h1>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* 프로필 영역 */}
      <div className="px-4 py-4">
        {/* 아바타 + 통계 */}
        <div className="flex items-center gap-6">
          {/* 아바타 */}
          <Avatar className="w-20 h-20 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback
              className={`text-2xl ${getAvatarColor(nickname)} text-white font-bold`}
            >
              {getInitials(nickname)}
            </AvatarFallback>
          </Avatar>

          {/* 통계 */}
          <div className="flex-1 flex justify-around">
            <ProfileStatItem label="묵상" value={stats.meditationCount} />
            <ProfileStatItem
              label="팔로워"
              value={stats.followersCount}
              onClick={onFollowersClick}
            />
            <ProfileStatItem
              label="팔로잉"
              value={stats.followingCount}
              onClick={onFollowingClick}
            />
          </div>
        </div>

        {/* 이름 + 소속 교회 */}
        <div className="mt-4">
          <h2 className="font-semibold text-base">{nickname}</h2>

          {/* 소속 교회 */}
          {churchName && (
            <button
              onClick={handleChurchClick}
              className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Church className="w-3.5 h-3.5" />
              <span>{churchName}</span>
            </button>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          {isOwnProfile ? (
            // 본인 프로필인 경우
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/mypage')}
            >
              내 프로필 관리
            </Button>
          ) : (
            // 다른 사용자 프로필인 경우
            <>
              <Button
                variant={isFollowing ? 'outline' : 'default'}
                className="flex-1"
                onClick={isFollowing ? onUnfollow : onFollow}
                disabled={isFollowLoading}
              >
                {isFollowLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : isFollowing ? (
                  <UserCheck className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {isFollowing ? '팔로잉' : '팔로우'}
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

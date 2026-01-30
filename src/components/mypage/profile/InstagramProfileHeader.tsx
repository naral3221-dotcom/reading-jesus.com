'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, LogOut, UserCheck, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getInitials, getAvatarColor } from '@/lib/date-utils';
import { ProfileStatItem } from './ProfileStatItem';
import { ProfileSettingsMenu } from './ProfileSettingsMenu';

interface ProfileStats {
  meditationCount: number;
  completedDays: number;
  currentStreak: number;
}

interface InstagramProfileHeaderProps {
  // 사용자 정보
  nickname: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  // 통계
  stats: ProfileStats;
  // 컨텍스트
  isChurchContext?: boolean;
  churchCode?: string;
  churchName?: string;
  isRegisteredMember?: boolean;
  // 액션
  onEditProfile: () => void;
  onLogout?: () => void;
  onShare?: () => void;
}

export function InstagramProfileHeader({
  nickname,
  avatarUrl,
  isAnonymous,
  stats,
  isChurchContext = false,
  churchCode,
  churchName,
  isRegisteredMember = false,
  onEditProfile,
  onLogout,
  onShare,
}: InstagramProfileHeaderProps) {
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

  return (
    <div className="bg-background">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        {isChurchContext ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-9" /> // 스페이서
        )}

        <h1 className="text-base font-semibold">{nickname}</h1>

        <ProfileSettingsMenu
          isChurchContext={isChurchContext}
          churchCode={churchCode}
          isAnonymous={isAnonymous}
          onLogout={onLogout}
        />
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
              {isAnonymous ? '?' : getInitials(nickname)}
            </AvatarFallback>
          </Avatar>

          {/* 통계 */}
          <div className="flex-1 flex justify-around">
            <ProfileStatItem label="묵상" value={stats.meditationCount} />
            <ProfileStatItem label="완료일" value={stats.completedDays} />
            <ProfileStatItem label="연속" value={stats.currentStreak} />
          </div>
        </div>

        {/* 이름 + 교회/멤버십 정보 */}
        <div className="mt-4">
          <h2 className="font-semibold text-base">{nickname}</h2>

          {/* 교회 컨텍스트: 멤버십 뱃지 */}
          {isChurchContext && (
            <div className="flex items-center gap-2 mt-1">
              {isRegisteredMember ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                  <UserCheck className="w-3 h-3" />
                  등록 교인
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                  <User className="w-3 h-3" />
                  방문자
                </span>
              )}
              {churchName && (
                <span className="text-xs text-muted-foreground">{churchName}</span>
              )}
            </div>
          )}

          {/* 익명 사용자 안내 */}
          {isAnonymous && (
            <p className="text-sm text-muted-foreground mt-1">
              로그인하면 데이터가 저장됩니다
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          {isAnonymous ? (
            <Button
              variant="default"
              className="flex-1"
              onClick={() => router.push('/login')}
            >
              <LogOut className="w-4 h-4 mr-2 rotate-180" />
              로그인하기
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onEditProfile}
              >
                프로필 수정
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

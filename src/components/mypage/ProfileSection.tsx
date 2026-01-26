'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, LogOut, User, UserCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getInitials, getAvatarColor } from '@/lib/date-utils';

interface ProfileSectionProps {
  // 사용자 정보
  nickname: string;
  avatar: string | null;
  isAnonymous: boolean;
  // 교회 컨텍스트
  isChurchContext?: boolean;
  isRegisteredMember?: boolean;
  // 메인 컨텍스트
  groupName?: string | null;
  groupCount?: number;
  // 액션
  onProfileClick?: () => void;
}

export function ProfileSection({
  nickname,
  avatar,
  isAnonymous,
  isChurchContext = false,
  isRegisteredMember = false,
  groupName,
  groupCount = 0,
  onProfileClick,
}: ProfileSectionProps) {
  const router = useRouter();

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      router.push('/mypage/profile');
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          {avatar || !isChurchContext ? (
            <Avatar className="w-16 h-16 ring-2 ring-primary/20 ring-offset-2">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {isAnonymous ? '?' : nickname[0]}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div
              className={`w-16 h-16 rounded-full ${getAvatarColor(nickname)} flex items-center justify-center ring-2 ring-white/20 ring-offset-2`}
            >
              <span className="text-white text-xl font-bold">
                {getInitials(nickname)}
              </span>
            </div>
          )}

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold truncate">{nickname}</h2>
              {isAnonymous && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => router.push('/login')}
                >
                  <LogOut className="w-3 h-3 mr-1 rotate-180" />
                  로그인하기
                </Button>
              )}
            </div>

            {/* 교회 컨텍스트: 멤버십 배지 */}
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
              </div>
            )}

            {/* 메인 컨텍스트: 그룹 정보 */}
            {!isChurchContext && (
              <p className="text-muted-foreground text-sm truncate">
                {isAnonymous ? (
                  '로그인하면 데이터가 저장됩니다'
                ) : groupCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {groupName}
                    {groupCount > 1 && (
                      <span className="text-xs text-muted-foreground/70">
                        외 {groupCount - 1}개
                      </span>
                    )}
                  </span>
                ) : (
                  '그룹 없음'
                )}
              </p>
            )}
          </div>

          {/* 프로필 수정 버튼 */}
          {!isAnonymous && (
            <Button variant="ghost" size="icon" onClick={handleProfileClick}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Church, ExternalLink, Plus, UserMinus, UserCheck, Flame } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Church as ChurchType, ActivityStats } from '@/types';

interface ChurchInfoSectionProps {
  // 메인 컨텍스트: 등록된 교회 표시
  userChurch?: ChurchType | null;
  onSearchChurch?: () => void;
  onLeaveChurch?: () => void;
  // 교회 컨텍스트: 현재 교회 정보 표시
  isChurchContext?: boolean;
  currentChurch?: ChurchType | null;
  isRegisteredMember?: boolean;
  isLoggedIn?: boolean;
  onRegisterMember?: () => void;
  // 교회 활동 통계 (통합 표시용)
  churchActivity?: ActivityStats | null;
}

export function ChurchInfoSection({
  userChurch,
  onSearchChurch,
  onLeaveChurch,
  isChurchContext = false,
  currentChurch,
  isRegisteredMember = false,
  isLoggedIn = false,
  onRegisterMember,
  churchActivity,
}: ChurchInfoSectionProps) {
  const router = useRouter();

  // 교회 컨텍스트: 현재 교회 정보 표시
  if (isChurchContext && currentChurch) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Church className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentChurch.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentChurch.denomination ||
                  `교회 코드: ${currentChurch.code}`}
              </p>
            </div>
          </div>

          {/* 등록 교인 여부에 따른 버튼 */}
          {isLoggedIn && !isRegisteredMember && (
            <Button className="w-full mt-4" onClick={onRegisterMember}>
              <UserCheck className="w-4 h-4 mr-2" />
              등록 교인으로 등록하기
            </Button>
          )}

          {isLoggedIn && isRegisteredMember && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-destructive hover:text-destructive"
              onClick={onLeaveChurch}
            >
              <UserMinus className="w-4 h-4 mr-2" />
              교회 탈퇴
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // 메인 컨텍스트: 등록된 교회 표시
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Church className="w-4 h-4 text-primary" />
          소속 교회
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userChurch ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Church className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{userChurch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {userChurch.denomination ||
                      '교회 코드: ' + userChurch.code}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/church/${userChurch.code}`)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>

            {/* 교회 활동 진행률 (통합) */}
            {churchActivity && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {churchActivity.completedDays}일 / {churchActivity.totalDays}일
                  </span>
                  <div className="flex items-center gap-2">
                    {churchActivity.currentStreak > 0 && (
                      <div className="flex items-center gap-1 text-accent-warm">
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{churchActivity.currentStreak}일</span>
                      </div>
                    )}
                    <span className="text-xs font-medium text-primary">
                      {churchActivity.progressPercentage}%
                    </span>
                  </div>
                </div>
                <Progress value={churchActivity.progressPercentage} className="h-2" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/church/${userChurch.code}`)}
              >
                <Church className="w-4 h-4 mr-1" />
                교회 페이지
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onLeaveChurch}
              >
                <UserMinus className="w-4 h-4 mr-1" />
                탈퇴
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Church className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              등록된 교회가 없습니다
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={onSearchChurch}>
                <Plus className="w-4 h-4 mr-1" />
                교회 검색하기
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/church/register')}
                className="bg-primary hover:bg-primary"
              >
                <Church className="w-4 h-4 mr-1" />
                새 교회 등록하기
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

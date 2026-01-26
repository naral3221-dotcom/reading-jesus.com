'use client';

import { Loader2 } from 'lucide-react';
import { useUserBadges } from '@/presentation/hooks/queries/useBadge';
import type { BadgeCategory, UserBadgeWithDefinition } from '@/types';

interface BadgeDisplayProps {
  userId: string;
  groupId?: string;
  maxDisplay?: number;  // 최대 표시 개수
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;  // 배지가 없을 때도 표시
}

export function BadgeDisplay({
  userId,
  groupId,
  maxDisplay = 5,
  size = 'md',
  showEmpty = false,
}: BadgeDisplayProps) {
  const { data: badges = [], isLoading: loading } = useUserBadges(userId, groupId);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  if (badges.length === 0) {
    if (!showEmpty) return null;
    return (
      <span className="text-xs text-muted-foreground">
        아직 획득한 배지가 없습니다
      </span>
    );
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className="flex items-center gap-0.5">
      {displayBadges.map((userBadge) => (
        <span
          key={userBadge.id}
          className={`cursor-help ${sizeClasses[size]}`}
          title={`${userBadge.badge.name}: ${userBadge.badge.description}`}
        >
          {userBadge.badge.icon}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={`text-muted-foreground cursor-help ${sizeClasses[size]}`}
          title={`외 ${remainingCount}개의 배지`}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// 배지 목록 전체 보기 컴포넌트
interface BadgeListProps {
  userId: string;
  groupId?: string;
}

export function BadgeList({ userId, groupId }: BadgeListProps) {
  const { data: badges = [], isLoading: loading } = useUserBadges(userId, groupId);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>아직 획득한 배지가 없습니다</p>
        <p className="text-sm mt-1">묵상을 작성하고 활동하면 배지를 획득할 수 있어요!</p>
      </div>
    );
  }

  // 카테고리별 그룹핑
  const categoryNames: Record<BadgeCategory, string> = {
    streak: '연속 읽기',
    meditation: '묵상',
    prayer: '기도',
    social: '소통',
  };

  const groupedBadges = badges.reduce((acc, badge) => {
    const category = badge.badge.category as BadgeCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(badge);
    return acc;
  }, {} as Record<BadgeCategory, UserBadgeWithDefinition[]>);

  return (
    <div className="space-y-6">
      {(Object.keys(groupedBadges) as BadgeCategory[]).map((category) => (
        <div key={category}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {categoryNames[category]}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {groupedBadges[category].map((userBadge) => (
              <div
                key={userBadge.id}
                className="flex flex-col items-center p-3 rounded-lg bg-muted/30 border"
              >
                <span className="text-3xl mb-2">{userBadge.badge.icon}</span>
                <p className="text-xs font-medium text-center">{userBadge.badge.name}</p>
                <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                  {new Date(userBadge.earned_at).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

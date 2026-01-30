'use client';

/**
 * 통합 통계 섹션
 *
 * 메인 마이페이지에서 활동별 상세 현황을 보여줍니다.
 * (총 완료일/연속일은 프로필 헤더에 이미 표시됨)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Church, Users, User } from 'lucide-react';
import type { IntegratedStats, ActivitySourceType } from '@/types';

interface IntegratedStatsSectionProps {
  stats: IntegratedStats;
  excludeChurch?: boolean; // 교회 활동을 제외할지 여부 (소속 교회 섹션에 통합 표시 시)
}

// 활동 타입별 아이콘
const SOURCE_ICONS: Record<ActivitySourceType, React.ReactNode> = {
  church: <Church className="w-4 h-4" />,
  group: <Users className="w-4 h-4" />,
  personal: <User className="w-4 h-4" />,
};

// 활동 타입별 라벨
const SOURCE_LABELS: Record<ActivitySourceType, string> = {
  church: '교회',
  group: '그룹',
  personal: '개인 프로젝트',
};

export function IntegratedStatsSection({ stats, excludeChurch = false }: IntegratedStatsSectionProps) {
  // 교회 활동 제외 옵션 적용
  const activities = excludeChurch
    ? stats.activities.filter(a => a.sourceType !== 'church')
    : stats.activities;

  // 활동이 하나도 없으면 렌더링 안 함
  if (activities.length === 0) {
    return null;
  }

  return (
    <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">활동별 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity) => (
            <ActivityItem key={`${activity.sourceType}-${activity.sourceId}`} activity={activity} />
          ))}
        </CardContent>
    </Card>
  );
}

// 개별 활동 아이템
interface ActivityItemProps {
  activity: IntegratedStats['activities'][0];
}

function ActivityItem({ activity }: ActivityItemProps) {
  const {
    sourceType,
    sourceName,
    completedDays,
    totalDays,
    progressPercentage,
    currentStreak,
  } = activity;

  return (
    <div className="space-y-2">
      {/* 헤더: 아이콘 + 이름 + 연속일 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            {SOURCE_ICONS[sourceType]}
          </div>
          <div>
            <p className="text-sm font-medium">{sourceName}</p>
            <p className="text-xs text-muted-foreground">
              {SOURCE_LABELS[sourceType]}
            </p>
          </div>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-accent-foreground">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{currentStreak}일 연속</span>
          </div>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {completedDays}일 / {totalDays}일
          </span>
          <span className="font-medium text-primary">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </div>
  );
}

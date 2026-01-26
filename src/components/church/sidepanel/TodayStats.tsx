'use client';

import { MessageCircle, FileEdit, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodayStats } from '@/presentation/hooks/queries/useChurchStats';

interface TodayStatsProps {
  churchCode: string;
  churchId?: string;
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export function TodayStats({ churchId }: TodayStatsProps) {
  const { data: stats, isLoading } = useTodayStats(churchId);

  const statItems: StatItem[] = [
    {
      label: '오늘 묵상',
      value: stats?.todayMeditations ?? 0,
      icon: <MessageCircle className="w-4 h-4" />,
      color: 'text-foreground bg-muted',
    },
    {
      label: '오늘 QT',
      value: stats?.todayQT ?? 0,
      icon: <FileEdit className="w-4 h-4" />,
      color: 'text-foreground bg-muted',
    },
    {
      label: '주간 참여자',
      value: stats?.activeMembers ?? 0,
      icon: <Users className="w-4 h-4" />,
      color: 'text-foreground bg-muted',
    },
  ];

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-1" />
                <div className="h-6 bg-muted rounded w-8 mx-auto mb-1" />
                <div className="h-3 bg-muted/50 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          오늘의 활동
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {statItems.map((item, index) => (
            <div key={index} className="text-center">
              <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mx-auto mb-1`}>
                {item.icon}
              </div>
              <div className="text-xl font-bold text-foreground">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

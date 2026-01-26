'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressSectionProps {
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
}

export function ProgressSection({
  completedDays,
  totalDays,
  progressPercentage,
}: ProgressSectionProps) {
  const remainingDays = totalDays - completedDays;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">나의 통독 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {completedDays}일 / {totalDays}일
            </span>
            <span className="font-medium text-primary">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-3 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {completedDays > 0 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              {remainingDays}일 남았습니다. 화이팅!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

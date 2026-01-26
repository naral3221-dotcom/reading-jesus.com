'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, BookOpen, MapPin, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { UserDailyReading } from '@/types';

interface MultiPlanReadingCardProps {
  reading: UserDailyReading;
  onCheck: (reading: UserDailyReading) => Promise<void>;
  isChecking?: boolean;
}

export function MultiPlanReadingCard({
  reading,
  onCheck,
  isChecking = false,
}: MultiPlanReadingCardProps) {
  const [showCheckDialog, setShowCheckDialog] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [checkAnimation, setCheckAnimation] = useState(false);

  const handleCheckClick = () => {
    setShowCheckDialog(true);
  };

  const handleConfirmCheck = async () => {
    if (!reading.is_checked) {
      setCheckAnimation(true);
      setTimeout(() => setCheckAnimation(false), 600);
    }
    await onCheck(reading);
    setShowCheckDialog(false);
  };

  // 읽기 범위 문자열 생성
  const getReadingRange = () => {
    if (reading.start_chapter === reading.end_chapter) {
      return `${reading.book_name} ${reading.start_chapter}장`;
    }
    return `${reading.book_name} ${reading.start_chapter}-${reading.end_chapter}장`;
  };

  // 플랜 아이콘
  const getPlanIcon = () => {
    if (reading.plan_type === 'reading_jesus') {
      return '📖';
    }
    return '📘';
  };

  return (
    <>
      <Card className={cn(
        "border-2 transition-all",
        reading.is_checked && "border-accent/30 bg-accent/10/50"
      )}>
        <CardContent className="p-4 space-y-3">
          {/* 플랜 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getPlanIcon()}</span>
              <div>
                <h3 className="font-semibold">{reading.plan_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Day {reading.day_number} · {reading.chapter_count}장
                </p>
              </div>
            </div>
            {reading.is_checked && (
              <span className="px-2 py-1 text-xs font-medium bg-accent/10 text-accent rounded-full">
                완료
              </span>
            )}
          </div>

          {/* 읽기 범위 */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-lg font-bold text-primary">{reading.book_name}</p>
            <p className="text-muted-foreground">{getReadingRange()}</p>
          </div>

          {/* 적용 그룹 */}
          <div>
            <button
              type="button"
              onClick={() => setShowGroups(!showGroups)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>적용: {reading.applied_groups.length}개 그룹</span>
              {showGroups ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showGroups && (
              <div className="mt-2 pl-5 space-y-1">
                {reading.applied_groups.map((group) => (
                  <div key={group.id} className="flex items-center gap-1.5 text-sm">
                    <span className="text-xs">
                      {group.type === 'church' ? '⛪' : '👥'}
                    </span>
                    <span>{group.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <Link
              href={`/bible-reader?book=${reading.book_name}&chapter=${reading.start_chapter}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full" size="sm">
                <BookOpen className="w-4 h-4 mr-1" />
                성경 읽기
              </Button>
            </Link>
            <Button
              variant={reading.is_checked ? "secondary" : "default"}
              size="sm"
              className={cn(
                "flex-1",
                reading.is_checked && "bg-accent/10 text-accent hover:bg-accent/20"
              )}
              onClick={handleCheckClick}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <div
                  className={cn(
                    "w-4 h-4 mr-1 rounded-full border-2 flex items-center justify-center transition-all",
                    reading.is_checked
                      ? "bg-accent border-accent"
                      : "border-current",
                    checkAnimation && "scale-110"
                  )}
                >
                  {reading.is_checked && (
                    <Check className={cn(
                      "w-3 h-3 text-white",
                      checkAnimation && "animate-in zoom-in-50 duration-300"
                    )} />
                  )}
                </div>
              )}
              {reading.is_checked ? '완료!' : '읽었어요'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 체크 확인 다이얼로그 */}
      <AlertDialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reading.is_checked ? '읽음 완료를 해제하시겠습니까?' : '읽음 완료 처리하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {reading.is_checked
                  ? `${reading.plan_name}의 Day ${reading.day_number} 읽음 완료가 해제됩니다.`
                  : `${reading.plan_name}의 Day ${reading.day_number}을(를) 읽음 완료로 표시합니다.`}
              </p>
              {reading.applied_groups.length > 1 && (
                <p className="text-sm bg-muted p-2 rounded">
                  💡 이 플랜을 사용하는 모든 그룹({reading.applied_groups.map(g => g.name).join(', ')})에 동시에 적용됩니다.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheck}>
              {reading.is_checked ? '해제하기' : '완료하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// 다중 플랜 읽기 리스트 컴포넌트
interface MultiPlanReadingListProps {
  readings: UserDailyReading[];
  onCheck: (reading: UserDailyReading) => Promise<void>;
  checkingPlanId?: string | null;
}

export function MultiPlanReadingList({
  readings,
  onCheck,
  checkingPlanId,
}: MultiPlanReadingListProps) {
  if (readings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            오늘 읽을 말씀이 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  // 완료/미완료 분리
  const completedReadings = readings.filter(r => r.is_checked);
  const pendingReadings = readings.filter(r => !r.is_checked);

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          오늘의 읽기 {readings.length}개
        </span>
        <span className={cn(
          "font-medium",
          completedReadings.length === readings.length ? "text-accent" : "text-muted-foreground"
        )}>
          {completedReadings.length}/{readings.length} 완료
        </span>
      </div>

      {/* 미완료 먼저 */}
      {pendingReadings.map((reading) => (
        <MultiPlanReadingCard
          key={reading.plan_id}
          reading={reading}
          onCheck={onCheck}
          isChecking={checkingPlanId === reading.plan_id}
        />
      ))}

      {/* 완료된 것 */}
      {completedReadings.length > 0 && pendingReadings.length > 0 && (
        <div className="text-xs text-muted-foreground text-center py-2">
          ─── 완료된 읽기 ───
        </div>
      )}
      {completedReadings.map((reading) => (
        <MultiPlanReadingCard
          key={reading.plan_id}
          reading={reading}
          onCheck={onCheck}
          isChecking={checkingPlanId === reading.plan_id}
        />
      ))}
    </div>
  );
}

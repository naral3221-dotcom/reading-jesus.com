'use client'

/**
 * WeeklyReportCard - 주간 리포트 카드
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, TrendingUp, TrendingDown, Minus, PenLine } from 'lucide-react'
import { startOfWeek, endOfWeek, format, isWithinInterval } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface WeeklyReportCardProps {
  checkedDays: { dayNumber: number; checkedAt: Date }[]
  meditationCount?: number
  currentStreak: number
}

export function WeeklyReportCard({
  checkedDays,
  meditationCount = 0,
  currentStreak,
}: WeeklyReportCardProps) {
  const weeklyStats = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // 월요일 시작
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    // 이번 주 읽은 날 수
    const thisWeekChecks = checkedDays.filter((check) =>
      isWithinInterval(check.checkedAt, { start: weekStart, end: weekEnd })
    )

    // 지난 주 통계
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(lastWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)

    const lastWeekChecks = checkedDays.filter((check) =>
      isWithinInterval(check.checkedAt, { start: lastWeekStart, end: lastWeekEnd })
    )

    const difference = thisWeekChecks.length - lastWeekChecks.length

    return {
      weeklyCompleted: thisWeekChecks.length,
      weeklyGoal: 7,
      weeklyRate: Math.round((thisWeekChecks.length / 7) * 100),
      difference,
      weekStart,
      weekEnd,
      lastWeekCount: lastWeekChecks.length,
    }
  }, [checkedDays])

  const getTrendIcon = () => {
    if (weeklyStats.difference > 0) {
      return <TrendingUp className="w-4 h-4 text-accent" />
    } else if (weeklyStats.difference < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  const getTrendMessage = () => {
    if (weeklyStats.difference > 0) {
      return `지난주보다 ${weeklyStats.difference}일 더 읽었어요!`
    } else if (weeklyStats.difference < 0) {
      return `지난주보다 ${Math.abs(weeklyStats.difference)}일 적게 읽었어요`
    }
    return '지난주와 동일해요'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          이번 주 리포트
          <span className="text-xs font-normal text-muted-foreground">
            {format(weeklyStats.weekStart, 'M/d', { locale: ko })} -{' '}
            {format(weeklyStats.weekEnd, 'M/d', { locale: ko })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 주간 진행 바 */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>읽은 날</span>
            <span className="font-medium">
              {weeklyStats.weeklyCompleted}/{weeklyStats.weeklyGoal}일 ({weeklyStats.weeklyRate}%)
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-3 transition-all duration-500 ease-out"
              style={{ width: `${weeklyStats.weeklyRate}%` }}
            />
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-accent/10 dark:bg-accent/20/30 rounded-lg">
            <Flame className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">연속 읽기</p>
              <p className="font-bold text-accent">{currentStreak}일</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-accent/10 dark:bg-accent/20/30 rounded-lg">
            <PenLine className="w-5 h-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">묵상 작성</p>
              <p className="font-bold text-accent">{meditationCount}개</p>
            </div>
          </div>
        </div>

        {/* 지난주 비교 */}
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-lg',
          weeklyStats.difference > 0
            ? 'bg-accent/10 dark:bg-accent/20/30'
            : weeklyStats.difference < 0
            ? 'bg-red-50 dark:bg-red-950/30'
            : 'bg-muted'
        )}>
          {getTrendIcon()}
          <span className="text-sm">{getTrendMessage()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

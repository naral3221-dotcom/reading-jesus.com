'use client'

/**
 * ReadingHeatmap - GitHub 스타일 읽기 패턴 히트맵
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  subDays,
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from 'date-fns'
import { cn } from '@/lib/utils'

interface ReadingHeatmapProps {
  checkedDays: { dayNumber: number; checkedAt: Date }[]
  meditationDays?: { dayNumber: number; createdAt: Date }[]
  weeks?: number // 표시할 주 수 (기본 12주)
}

type CellStatus = 'none' | 'read' | 'meditation'

export function ReadingHeatmap({
  checkedDays,
  meditationDays = [],
  weeks = 12,
}: ReadingHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date()
    const totalDays = weeks * 7
    const startDate = startOfWeek(subDays(today, totalDays - 1), { weekStartsOn: 0 })

    // 날짜별 상태 맵 생성
    const statusMap = new Map<string, CellStatus>()

    // 읽음 체크 데이터
    checkedDays.forEach((check) => {
      const dateKey = format(check.checkedAt, 'yyyy-MM-dd')
      statusMap.set(dateKey, 'read')
    })

    // 묵상 작성 데이터 (읽음보다 우선)
    meditationDays.forEach((meditation) => {
      const dateKey = format(meditation.createdAt, 'yyyy-MM-dd')
      statusMap.set(dateKey, 'meditation')
    })

    // 그리드 데이터 생성 (7행 x N열)
    const grid: { date: Date; status: CellStatus; dateStr: string }[][] = []

    // 각 주별로 데이터 구성
    for (let week = 0; week < weeks; week++) {
      const weekData: { date: Date; status: CellStatus; dateStr: string }[] = []
      for (let day = 0; day < 7; day++) {
        const date = addDays(startDate, week * 7 + day)
        const dateKey = format(date, 'yyyy-MM-dd')
        const dateStr = format(date, 'M/d')

        if (date > today) {
          weekData.push({ date, status: 'none', dateStr })
        } else {
          weekData.push({
            date,
            status: statusMap.get(dateKey) || 'none',
            dateStr,
          })
        }
      }
      grid.push(weekData)
    }

    return grid
  }, [checkedDays, meditationDays, weeks])

  const getCellStyle = (status: CellStatus, isFuture: boolean) => {
    if (isFuture) return 'bg-muted/30'

    switch (status) {
      case 'meditation':
        return 'bg-accent'
      case 'read':
        return 'bg-accent'
      default:
        return 'bg-muted'
    }
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토']
  const today = new Date()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">읽기 패턴 (최근 {weeks}주)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-fit">
            {/* 요일 라벨 */}
            <div className="flex">
              <div className="w-8" /> {/* 빈 공간 */}
              {weekDays.map((day, idx) => (
                <div
                  key={day}
                  className={cn(
                    'w-4 h-4 text-[10px] text-center mb-1',
                    idx === 0 && 'text-red-500',
                    idx === 6 && 'text-accent'
                  )}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 히트맵 그리드 */}
            <div className="flex gap-0.5">
              {heatmapData.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {week.map((day, dayIdx) => {
                    const isFuture = day.date > today
                    const isToday = isSameDay(day.date, today)

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          'w-4 h-4 rounded-sm transition-all',
                          getCellStyle(day.status, isFuture),
                          isToday && 'ring-2 ring-primary ring-offset-1'
                        )}
                        title={`${day.dateStr}: ${
                          day.status === 'meditation'
                            ? '묵상 작성'
                            : day.status === 'read'
                            ? '읽음'
                            : '미읽음'
                        }`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="flex items-center justify-end gap-3 mt-3 pt-2 border-t">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <span>미읽음</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-accent" />
                <span>읽음</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-accent" />
                <span>묵상</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

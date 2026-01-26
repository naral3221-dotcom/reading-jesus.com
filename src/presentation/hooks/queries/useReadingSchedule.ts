'use client'

/**
 * Reading Schedule React Query Hooks
 *
 * 성경 통독 일정 관련 React Query 훅.
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { getTodayDateString } from '@/lib/date-utils'

// Query Keys
export const readingScheduleKeys = {
  all: ['readingSchedule'] as const,
  weekly: (year: number, weekStart: string) =>
    [...readingScheduleKeys.all, 'weekly', year, weekStart] as const,
  today: () => [...readingScheduleKeys.all, 'today'] as const,
}

export interface ReadingSchedule {
  date: string
  reading: string
  memory_verse: string | null
  is_supplement_week: boolean
}

/**
 * 이번 주 성경 읽기 일정 조회 훅
 */
export function useWeeklyReadingSchedule() {
  return useQuery({
    queryKey: readingScheduleKeys.weekly(
      new Date().getFullYear(),
      getWeekStartDate()
    ),
    queryFn: async (): Promise<{ schedules: ReadingSchedule[]; todaySchedule: ReadingSchedule | null }> => {
      const supabase = getSupabaseBrowserClient()
      const today = getTodayDateString()
      const year = new Date().getFullYear()

      // 이번 주 일정 로드
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const { data, error } = await supabase
        .from('reading_schedules')
        .select('date, reading, memory_verse, is_supplement_week')
        .eq('year', year)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0])
        .order('date')

      if (error) {
        console.error('일정 로드 에러:', error)
        return { schedules: [], todaySchedule: null }
      }

      const schedules = data || []
      const todaySchedule = schedules.find((s) => s.date === today) || null

      return { schedules, todaySchedule }
    },
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

function getWeekStartDate(): string {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart.toISOString().split('T')[0]
}

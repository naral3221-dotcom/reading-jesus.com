'use client'

/**
 * QT React Query Hooks
 *
 * QT 데이터 조회를 위한 React Query 훅들.
 */

import { useQuery } from '@tanstack/react-query'
import { GetDailyQT } from '@/application/use-cases/qt/GetDailyQT'
import { GetMonthlyQT } from '@/application/use-cases/qt/GetMonthlyQT'
import { SupabaseQTRepository } from '@/infrastructure/repositories/SupabaseQTRepository'

// Query Key Factory
export const qtKeys = {
  all: ['qt'] as const,
  daily: (date: string) => [...qtKeys.all, 'daily', date] as const,
  dayNumber: (dayNumber: number) => [...qtKeys.all, 'day', dayNumber] as const,
  monthly: (year: number, month: number) => [...qtKeys.all, 'monthly', year, month] as const,
  today: () => [...qtKeys.all, 'today'] as const,
}

// Repository 인스턴스 (싱글톤)
const qtRepository = new SupabaseQTRepository()

/**
 * 오늘의 QT를 조회하는 훅
 */
export function useTodayQT() {
  const getDailyQT = new GetDailyQT(qtRepository)

  return useQuery({
    queryKey: qtKeys.today(),
    queryFn: async () => {
      const result = await getDailyQT.execute({})
      if (result.error) throw new Error(result.error)
      return result.qt
    },
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

/**
 * 특정 날짜의 QT를 조회하는 훅
 */
export function useDailyQT(date: Date | null) {
  const getDailyQT = new GetDailyQT(qtRepository)

  return useQuery({
    queryKey: qtKeys.daily(date?.toISOString().split('T')[0] ?? ''),
    queryFn: async () => {
      if (!date) return null
      const result = await getDailyQT.execute({ date })
      if (result.error) throw new Error(result.error)
      return result.qt
    },
    enabled: !!date,
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

/**
 * 특정 일차의 QT를 조회하는 훅
 */
export function useQTByDayNumber(dayNumber: number | null) {
  const getDailyQT = new GetDailyQT(qtRepository)

  return useQuery({
    queryKey: qtKeys.dayNumber(dayNumber ?? 0),
    queryFn: async () => {
      if (!dayNumber) return null
      const result = await getDailyQT.execute({ dayNumber })
      if (result.error) throw new Error(result.error)
      return result.qt
    },
    enabled: !!dayNumber && dayNumber > 0,
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

/**
 * 월별 QT 목록을 조회하는 훅
 */
export function useMonthlyQT(year: number, month: number) {
  const getMonthlyQT = new GetMonthlyQT(qtRepository)

  return useQuery({
    queryKey: qtKeys.monthly(year, month),
    queryFn: async () => {
      const result = await getMonthlyQT.execute({ year, month })
      if (result.error) throw new Error(result.error)
      return result.qtList
    },
    staleTime: 1000 * 60 * 60, // 1시간
  })
}

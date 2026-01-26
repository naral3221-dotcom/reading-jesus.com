'use client'

/**
 * UserDailyReadings React Query Hooks
 *
 * 사용자 일일 읽기 정보 관리를 위한 React Query 훅들입니다.
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetUserDailyReadings } from '@/application/use-cases/reading/GetUserDailyReadings'
import { TogglePlanCheck } from '@/application/use-cases/reading/TogglePlanCheck'
import { SupabaseUserDailyReadingRepository } from '@/infrastructure/repositories/SupabaseUserDailyReadingRepository'

// Query Key Factory
export const userDailyReadingKeys = {
  all: ['userDailyReadings'] as const,
  byUser: (userId: string) => [...userDailyReadingKeys.all, 'user', userId] as const,
}

// Repository 인스턴스 (싱글톤)
const userDailyReadingRepository = new SupabaseUserDailyReadingRepository()

// Use Case 인스턴스
const getUserDailyReadings = new GetUserDailyReadings(userDailyReadingRepository)
const togglePlanCheck = new TogglePlanCheck(userDailyReadingRepository)

/**
 * 사용자의 오늘 읽기 목록 조회 훅
 *
 * @param userId 사용자 ID
 * @returns 읽기 목록 및 로딩 상태
 *
 * @example
 * const { data: readings, isLoading } = useUserDailyReadings(userId)
 */
export function useUserDailyReadings(userId: string | null) {
  return useQuery({
    queryKey: userDailyReadingKeys.byUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []

      const result = await getUserDailyReadings.execute({ userId })
      if (result.error) throw new Error(result.error)
      // 도메인 엔티티를 DTO로 변환하여 반환 (기존 types/index.ts와 호환)
      return result.readings.map((r) => r.toDTO())
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분 (구 cacheTime)
  })
}

/**
 * 플랜 체크 토글 뮤테이션 훅
 *
 * @returns 뮤테이션 핸들러
 *
 * @example
 * const { mutateAsync: toggleCheck } = useTogglePlanCheck()
 * await toggleCheck({ userId, planId, dayNumber, groupIds, isChecked: true })
 */
export function useTogglePlanCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      userId: string
      planId: string
      dayNumber: number
      groupIds: string[]
      isChecked: boolean
    }) => {
      const result = await togglePlanCheck.execute(input)
      if (!result.success) throw new Error(result.error ?? '체크 처리 실패')
      return result
    },
    onSuccess: (_, variables) => {
      // 읽기 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: userDailyReadingKeys.byUser(variables.userId),
      })
    },
  })
}

/**
 * 편의를 위한 복합 훅
 * 읽기 목록 조회 + 체크 토글 기능을 함께 제공
 *
 * @param userId 사용자 ID
 * @returns 읽기 목록, 로딩 상태, 체크 토글 함수
 *
 * @example
 * const { readings, isLoading, toggleCheck, isToggling, checkingPlanId } = useUserDailyReadingsWithToggle(userId)
 * await toggleCheck(reading)
 */
export function useUserDailyReadingsWithToggle(userId: string | null) {
  const { data: readings = [], isLoading, error, refetch } = useUserDailyReadings(userId)
  const toggleMutation = useTogglePlanCheck()
  const [checkingPlanId, setCheckingPlanId] = useState<string | null>(null)

  const toggleCheck = async (reading: {
    plan_id: string
    day_number: number
    applied_groups: { id: string }[]
    is_checked: boolean
  }) => {
    if (!userId) return

    setCheckingPlanId(reading.plan_id)

    try {
      await toggleMutation.mutateAsync({
        userId,
        planId: reading.plan_id,
        dayNumber: reading.day_number,
        groupIds: reading.applied_groups.map((g) => g.id),
        isChecked: !reading.is_checked, // 현재 상태의 반대로 토글
      })
    } finally {
      setCheckingPlanId(null)
    }
  }

  return {
    readings,
    isLoading,
    error,
    refetch,
    toggleCheck,
    isToggling: toggleMutation.isPending,
    checkingPlanId,
  }
}

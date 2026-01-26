'use client'

/**
 * ReadingCheck React Query Hooks
 *
 * 읽음 체크 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetReadingChecks } from '@/application/use-cases/reading-check/GetReadingChecks'
import { ToggleReadingCheck } from '@/application/use-cases/reading-check/ToggleReadingCheck'
import { GetReadingProgress } from '@/application/use-cases/reading-check/GetReadingProgress'
import { CalculateStreak } from '@/application/use-cases/reading-check/CalculateStreak'
import { GetAllGroupReadings } from '@/application/use-cases/reading-check/GetAllGroupReadings'
import { SupabaseReadingCheckRepository } from '@/infrastructure/repositories/SupabaseReadingCheckRepository'
import { ReadingCheckContext } from '@/domain/repositories/IReadingCheckRepository'

// Query Key Factory
export const readingCheckKeys = {
  all: ['readingCheck'] as const,
  byGroup: (userId: string, groupId: string) =>
    [...readingCheckKeys.all, 'group', userId, groupId] as const,
  byChurch: (userId: string, churchId: string) =>
    [...readingCheckKeys.all, 'church', userId, churchId] as const,
  progress: (userId: string, context: ReadingCheckContext) =>
    [...readingCheckKeys.all, 'progress', userId, context.groupId || context.churchId] as const,
  streak: (userId: string, context: ReadingCheckContext) =>
    [...readingCheckKeys.all, 'streak', userId, context.groupId || context.churchId] as const,
  allGroupReadings: (userId: string) =>
    [...readingCheckKeys.all, 'allGroupReadings', userId] as const,
}

// Repository 인스턴스 (싱글톤)
const readingCheckRepository = new SupabaseReadingCheckRepository()

/**
 * 읽음 체크 목록 조회 훅
 */
export function useReadingChecks(
  userId: string | null,
  context: ReadingCheckContext,
  options?: {
    enabled?: boolean
  }
) {
  const getReadingChecks = new GetReadingChecks(readingCheckRepository)
  const contextKey = context.groupId
    ? readingCheckKeys.byGroup(userId ?? '', context.groupId)
    : readingCheckKeys.byChurch(userId ?? '', context.churchId ?? '')

  return useQuery({
    queryKey: contextKey,
    queryFn: async () => {
      if (!userId || (!context.groupId && !context.churchId)) {
        return { checks: [], checkedDayNumbers: [], error: null }
      }

      const result = await getReadingChecks.execute({
        userId,
        groupId: context.groupId,
        churchId: context.churchId,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId && !!(context.groupId || context.churchId),
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 체크된 일자 번호만 조회하는 훅
 */
export function useCheckedDayNumbers(
  userId: string | null,
  context: ReadingCheckContext,
  options?: {
    enabled?: boolean
  }
) {
  const query = useReadingChecks(userId, context, options)

  return {
    ...query,
    data: query.data?.checkedDayNumbers ?? [],
  }
}

/**
 * 읽음 체크 토글 뮤테이션 훅 (옵티미스틱 업데이트 적용)
 */
export function useToggleReadingCheck(context: ReadingCheckContext) {
  const queryClient = useQueryClient()
  const toggleReadingCheck = new ToggleReadingCheck(readingCheckRepository)

  return useMutation({
    mutationFn: async ({ userId, dayNumber }: { userId: string; dayNumber: number }) => {
      const result = await toggleReadingCheck.execute({
        userId,
        dayNumber,
        context,
      })
      if (result.error) throw new Error(result.error)
      return result
    },
    onMutate: async ({ userId, dayNumber }) => {
      // 진행 중인 리페치 취소
      const queryKey = context.groupId
        ? readingCheckKeys.byGroup(userId, context.groupId)
        : readingCheckKeys.byChurch(userId, context.churchId ?? '')

      await queryClient.cancelQueries({ queryKey })

      // 이전 데이터 스냅샷 저장
      const previousData = queryClient.getQueryData(queryKey)

      // 옵티미스틱 업데이트: 체크 상태 토글
      queryClient.setQueryData(queryKey, (old: { checks: { dayNumber: number; checkedAt: Date | null }[]; checkedDayNumbers: number[]; error: null } | undefined) => {
        if (!old) return old

        const isCurrentlyChecked = old.checkedDayNumbers.includes(dayNumber)

        if (isCurrentlyChecked) {
          // 체크 해제
          return {
            ...old,
            checks: old.checks.filter(c => c.dayNumber !== dayNumber),
            checkedDayNumbers: old.checkedDayNumbers.filter(d => d !== dayNumber),
          }
        } else {
          // 체크 추가
          return {
            ...old,
            checks: [...old.checks, { dayNumber, checkedAt: new Date() }],
            checkedDayNumbers: [...old.checkedDayNumbers, dayNumber],
          }
        }
      })

      return { previousData, queryKey }
    },
    onError: (err, variables, rollbackContext) => {
      // 에러 발생 시 이전 상태로 롤백
      if (rollbackContext?.previousData) {
        queryClient.setQueryData(rollbackContext.queryKey, rollbackContext.previousData)
      }
    },
    onSettled: (_, __, variables) => {
      // 서버 상태와 동기화를 위해 쿼리 무효화
      if (context.groupId) {
        queryClient.invalidateQueries({
          queryKey: readingCheckKeys.byGroup(variables.userId, context.groupId),
        })
      }
      if (context.churchId) {
        queryClient.invalidateQueries({
          queryKey: readingCheckKeys.byChurch(variables.userId, context.churchId),
        })
      }
      // 진행률과 스트릭도 무효화
      queryClient.invalidateQueries({
        queryKey: readingCheckKeys.progress(variables.userId, context),
      })
      queryClient.invalidateQueries({
        queryKey: readingCheckKeys.streak(variables.userId, context),
      })
    },
  })
}

/**
 * 읽기 진행률 조회 훅
 */
export function useReadingProgress(
  userId: string | null,
  context: ReadingCheckContext,
  options?: {
    totalDays?: number
    enabled?: boolean
  }
) {
  const getReadingProgress = new GetReadingProgress(readingCheckRepository)

  return useQuery({
    queryKey: readingCheckKeys.progress(userId ?? '', context),
    queryFn: async () => {
      if (!userId || (!context.groupId && !context.churchId)) {
        return { progress: null, error: null }
      }

      const result = await getReadingProgress.execute({
        userId,
        groupId: context.groupId,
        churchId: context.churchId,
        totalDays: options?.totalDays,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId && !!(context.groupId || context.churchId),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 스트릭 조회 훅
 */
export function useReadingStreak(
  userId: string | null,
  context: ReadingCheckContext,
  options?: {
    enabled?: boolean
  }
) {
  const calculateStreak = new CalculateStreak(readingCheckRepository)

  return useQuery({
    queryKey: readingCheckKeys.streak(userId ?? '', context),
    queryFn: async () => {
      if (!userId || (!context.groupId && !context.churchId)) {
        return { streak: null, error: null }
      }

      const result = await calculateStreak.execute({
        userId,
        groupId: context.groupId,
        churchId: context.churchId,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId && !!(context.groupId || context.churchId),
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 편의를 위한 통합 훅 - 체크 상태와 토글 함수를 함께 제공
 */
export function useReadingCheckWithToggle(
  userId: string | null,
  context: ReadingCheckContext
) {
  const checksQuery = useReadingChecks(userId, context)
  const toggleMutation = useToggleReadingCheck(context)

  const checkedDays = new Map<number, string | null>()
  checksQuery.data?.checks.forEach(check => {
    checkedDays.set(check.dayNumber, check.checkedAt?.toISOString() ?? null)
  })

  const isChecked = (dayNumber: number) => checkedDays.has(dayNumber)

  const toggle = async (dayNumber: number) => {
    if (!userId) return
    await toggleMutation.mutateAsync({ userId, dayNumber })
  }

  return {
    checkedDays,
    checkedDayNumbers: checksQuery.data?.checkedDayNumbers ?? [],
    isChecked,
    toggle,
    isLoading: checksQuery.isLoading,
    isToggling: toggleMutation.isPending,
    error: checksQuery.error,
  }
}

/**
 * 사용자의 모든 그룹에 대한 읽기 데이터 조회 훅
 */
export function useAllGroupReadings(
  userId: string | null,
  groupIds: string[],
  options?: {
    enabled?: boolean
  }
) {
  const getAllGroupReadings = new GetAllGroupReadings(readingCheckRepository)

  return useQuery({
    queryKey: readingCheckKeys.allGroupReadings(userId ?? ''),
    queryFn: async () => {
      if (!userId || groupIds.length === 0) {
        return { groupReadings: [], error: null }
      }

      const result = await getAllGroupReadings.execute({
        userId,
        groupIds,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId && groupIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

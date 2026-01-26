'use client'

/**
 * UnifiedReadingCheck React Query Hooks
 *
 * 통합 읽음 체크 관련 React Query 훅들.
 * 그룹 읽음 체크와 교회 읽음 체크를 통합 관리.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseUnifiedReadingCheckRepository } from '@/infrastructure/repositories/SupabaseUnifiedReadingCheckRepository'
import type { UnifiedReadingCheckSearchParams } from '@/domain/repositories/IUnifiedReadingCheckRepository'
import type {
  SourceType,
  UnifiedReadingCheckProps,
  UnifiedReadingProgressProps,
  UnifiedReadingStreakProps,
  UserReadingsBySource,
} from '@/domain/entities/UnifiedReadingCheck'

// Query Key Factory
export const unifiedReadingCheckKeys = {
  all: ['unifiedReadingCheck'] as const,
  byUserAndSource: (userId: string, sourceType: SourceType, sourceId: string) =>
    [...unifiedReadingCheckKeys.all, 'user', userId, sourceType, sourceId] as const,
  checkedDays: (userId: string, sourceType: SourceType, sourceId: string) =>
    [...unifiedReadingCheckKeys.all, 'checkedDays', userId, sourceType, sourceId] as const,
  progress: (userId: string, sourceType: SourceType, sourceId: string) =>
    [...unifiedReadingCheckKeys.all, 'progress', userId, sourceType, sourceId] as const,
  streak: (userId: string, sourceType: SourceType, sourceId: string) =>
    [...unifiedReadingCheckKeys.all, 'streak', userId, sourceType, sourceId] as const,
  allByUser: (userId: string) =>
    [...unifiedReadingCheckKeys.all, 'allByUser', userId] as const,
  totalDays: (userId: string, sourceType?: SourceType | null) =>
    [...unifiedReadingCheckKeys.all, 'totalDays', userId, sourceType] as const,
}

// Repository 인스턴스 (싱글톤)
const readingCheckRepository = new SupabaseUnifiedReadingCheckRepository()

/**
 * 사용자의 특정 출처 읽음 기록 조회 훅
 */
export function useUnifiedReadingChecks(
  userId: string | null,
  sourceType: SourceType,
  sourceId: string | null,
  options?: { enabled?: boolean }
) {
  const params: UnifiedReadingCheckSearchParams = {
    userId: userId ?? '',
    sourceType,
    sourceId: sourceId ?? '',
  }

  return useQuery({
    queryKey: unifiedReadingCheckKeys.byUserAndSource(
      userId ?? '',
      sourceType,
      sourceId ?? ''
    ),
    queryFn: () => readingCheckRepository.findByUserAndSource(params),
    enabled: (options?.enabled ?? true) && !!userId && !!sourceId,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 체크된 day number 목록 조회 훅
 */
export function useUnifiedCheckedDays(
  userId: string | null,
  sourceType: SourceType,
  sourceId: string | null,
  options?: { enabled?: boolean }
) {
  const params: UnifiedReadingCheckSearchParams = {
    userId: userId ?? '',
    sourceType,
    sourceId: sourceId ?? '',
  }

  return useQuery({
    queryKey: unifiedReadingCheckKeys.checkedDays(
      userId ?? '',
      sourceType,
      sourceId ?? ''
    ),
    queryFn: () => readingCheckRepository.getCheckedDayNumbers(params),
    enabled: (options?.enabled ?? true) && !!userId && !!sourceId,
    staleTime: 1000 * 30,
  })
}

/**
 * 읽음 토글 뮤테이션 훅 (옵티미스틱 업데이트)
 */
export function useToggleUnifiedReadingCheck(
  sourceType: SourceType,
  sourceId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, dayNumber }: { userId: string; dayNumber: number }) =>
      readingCheckRepository.toggle(userId, sourceType, sourceId, dayNumber),

    // 옵티미스틱 업데이트
    onMutate: async ({ userId, dayNumber }) => {
      const queryKey = unifiedReadingCheckKeys.checkedDays(userId, sourceType, sourceId)
      await queryClient.cancelQueries({ queryKey })

      const previousDays = queryClient.getQueryData<number[]>(queryKey)

      // 옵티미스틱 업데이트
      queryClient.setQueryData<number[]>(queryKey, (old) => {
        if (!old) return [dayNumber]
        const isChecked = old.includes(dayNumber)
        if (isChecked) {
          return old.filter((d) => d !== dayNumber)
        }
        return [...old, dayNumber].sort((a, b) => a - b)
      })

      return { previousDays }
    },

    onError: (_err, { userId }, context) => {
      // 에러 시 롤백
      if (context?.previousDays) {
        queryClient.setQueryData(
          unifiedReadingCheckKeys.checkedDays(userId, sourceType, sourceId),
          context.previousDays
        )
      }
    },

    onSettled: (_data, _error, { userId }) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: unifiedReadingCheckKeys.byUserAndSource(userId, sourceType, sourceId),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedReadingCheckKeys.progress(userId, sourceType, sourceId),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedReadingCheckKeys.streak(userId, sourceType, sourceId),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedReadingCheckKeys.allByUser(userId),
      })
    },
  })
}

/**
 * 진행률 조회 훅
 */
export function useUnifiedReadingProgress(
  userId: string | null,
  sourceType: SourceType,
  sourceId: string | null,
  options?: {
    totalDays?: number
    currentDay?: number
    enabled?: boolean
  }
): { data: UnifiedReadingProgressProps | undefined; isLoading: boolean; error: Error | null } {
  const params: UnifiedReadingCheckSearchParams = {
    userId: userId ?? '',
    sourceType,
    sourceId: sourceId ?? '',
  }

  return useQuery({
    queryKey: unifiedReadingCheckKeys.progress(
      userId ?? '',
      sourceType,
      sourceId ?? ''
    ),
    queryFn: () =>
      readingCheckRepository.getProgress(
        params,
        options?.totalDays ?? 365,
        options?.currentDay ?? 1
      ),
    enabled: (options?.enabled ?? true) && !!userId && !!sourceId,
    staleTime: 1000 * 60, // 1분
  })
}

/**
 * 스트릭 조회 훅
 */
export function useUnifiedReadingStreak(
  userId: string | null,
  sourceType: SourceType,
  sourceId: string | null,
  currentDay?: number,
  options?: { enabled?: boolean }
): { data: UnifiedReadingStreakProps | undefined; isLoading: boolean; error: Error | null } {
  const params: UnifiedReadingCheckSearchParams = {
    userId: userId ?? '',
    sourceType,
    sourceId: sourceId ?? '',
  }

  return useQuery({
    queryKey: unifiedReadingCheckKeys.streak(
      userId ?? '',
      sourceType,
      sourceId ?? ''
    ),
    queryFn: () => readingCheckRepository.calculateStreak(params, currentDay),
    enabled: (options?.enabled ?? true) && !!userId && !!sourceId,
    staleTime: 1000 * 60, // 1분
  })
}

/**
 * 사용자의 모든 출처별 읽음 기록 조회 훅 (mypage용)
 */
export function useAllUserReadings(
  userId: string | null,
  options?: { enabled?: boolean }
): {
  data: UserReadingsBySource[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const query = useQuery({
    queryKey: unifiedReadingCheckKeys.allByUser(userId ?? ''),
    queryFn: () => readingCheckRepository.findAllByUser(userId!),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 60, // 1분
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * 총 읽은 일수 조회 훅
 */
export function useUnifiedTotalReadDays(
  userId: string | null,
  sourceType?: SourceType | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: unifiedReadingCheckKeys.totalDays(userId ?? '', sourceType),
    queryFn: () => readingCheckRepository.getTotalReadDays(userId!, sourceType),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 60,
  })
}

/**
 * 특정 day의 읽음 상태 확인 훅
 */
export function useIsUnifiedDayChecked(
  userId: string | null,
  sourceType: SourceType,
  sourceId: string | null,
  dayNumber: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [
      ...unifiedReadingCheckKeys.byUserAndSource(
        userId ?? '',
        sourceType,
        sourceId ?? ''
      ),
      'isChecked',
      dayNumber,
    ],
    queryFn: () =>
      readingCheckRepository.isChecked(userId!, sourceType, sourceId!, dayNumber),
    enabled: (options?.enabled ?? true) && !!userId && !!sourceId && dayNumber > 0,
    staleTime: 1000 * 30,
  })
}

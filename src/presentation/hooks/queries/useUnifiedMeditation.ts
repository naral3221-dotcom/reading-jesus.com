'use client'

/**
 * UnifiedMeditation React Query Hooks
 *
 * 통합 묵상 관련 React Query 훅들.
 * 그룹 묵상, 교회 묵상, QT 나눔을 통합 관리.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseUnifiedMeditationRepository } from '@/infrastructure/repositories/SupabaseUnifiedMeditationRepository'
import type {
  UnifiedMeditationSearchParams,
  UserMeditationSearchParams,
} from '@/domain/repositories/IUnifiedMeditationRepository'
import type {
  SourceType,
  ContentType,
  CreateUnifiedMeditationInput,
  UpdateUnifiedMeditationInput,
  CreateUnifiedMeditationReplyInput,
  UnifiedMeditationProps,
} from '@/domain/entities/UnifiedMeditation'

// Query Key Factory
export const unifiedMeditationKeys = {
  all: ['unifiedMeditation'] as const,
  lists: () => [...unifiedMeditationKeys.all, 'list'] as const,
  list: (params: Partial<UnifiedMeditationSearchParams>) =>
    [...unifiedMeditationKeys.lists(), params] as const,
  bySource: (sourceType: SourceType, sourceId: string) =>
    [...unifiedMeditationKeys.all, 'source', sourceType, sourceId] as const,
  bySourceAndDay: (sourceType: SourceType, sourceId: string, dayNumber: number | null) =>
    [...unifiedMeditationKeys.all, 'source', sourceType, sourceId, 'day', dayNumber] as const,
  detail: (id: string) => [...unifiedMeditationKeys.all, 'detail', id] as const,
  byUser: (userId: string) => [...unifiedMeditationKeys.all, 'user', userId] as const,
  replies: (meditationId: string) =>
    [...unifiedMeditationKeys.all, 'replies', meditationId] as const,
  count: (sourceType: SourceType, sourceId: string, dayNumber?: number | null) =>
    [...unifiedMeditationKeys.all, 'count', sourceType, sourceId, dayNumber] as const,
}

// Repository 인스턴스 (싱글톤)
const meditationRepository = new SupabaseUnifiedMeditationRepository()

/**
 * 출처별 묵상 목록 조회 훅
 */
export function useUnifiedMeditations(
  sourceType: SourceType,
  sourceId: string | null,
  options?: {
    dayNumber?: number | null
    contentType?: ContentType | null
    userId?: string | null
    filter?: 'all' | 'mine' | 'pinned'
    limit?: number
    offset?: number
    enabled?: boolean
  }
) {
  const params: UnifiedMeditationSearchParams = {
    sourceType,
    sourceId: sourceId ?? '',
    dayNumber: options?.dayNumber,
    contentType: options?.contentType,
    userId: options?.userId,
    filter: options?.filter ?? 'all',
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  }

  return useQuery({
    queryKey: unifiedMeditationKeys.list(params),
    queryFn: () => meditationRepository.findBySource(params),
    enabled: (options?.enabled ?? true) && !!sourceId,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 사용자의 모든 묵상 조회 훅 (mypage용)
 */
export function useUserMeditations(
  userId: string | null,
  options?: {
    sourceType?: SourceType | null
    contentType?: ContentType | null
    limit?: number
    offset?: number
    enabled?: boolean
  }
) {
  const params: UserMeditationSearchParams = {
    userId: userId ?? '',
    sourceType: options?.sourceType,
    contentType: options?.contentType,
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  }

  return useQuery({
    queryKey: unifiedMeditationKeys.byUser(userId ?? ''),
    queryFn: () => meditationRepository.findByUser(params),
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 30,
  })
}

/**
 * 묵상 상세 조회 훅
 */
export function useUnifiedMeditationDetail(
  id: string | null,
  userId?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: unifiedMeditationKeys.detail(id ?? ''),
    queryFn: () => meditationRepository.findById(id!, userId),
    enabled: (options?.enabled ?? true) && !!id,
    staleTime: 1000 * 30,
  })
}

/**
 * 묵상 생성 뮤테이션 훅
 */
export function useCreateUnifiedMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUnifiedMeditationInput) => meditationRepository.create(input),
    onSuccess: (data) => {
      // 해당 출처의 묵상 목록 무효화
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.bySource(data.sourceType, data.sourceId),
      })
      // 사용자 묵상 목록도 무효화
      if (data.userId) {
        queryClient.invalidateQueries({
          queryKey: unifiedMeditationKeys.byUser(data.userId),
        })
      }
    },
  })
}

/**
 * 묵상 수정 뮤테이션 훅
 */
export function useUpdateUnifiedMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      userId,
      guestToken,
      input,
    }: {
      id: string
      userId: string | null
      guestToken: string | null
      input: UpdateUnifiedMeditationInput
    }) => meditationRepository.update(id, userId, guestToken, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.detail(data.id),
      })
    },
  })
}

/**
 * 묵상 삭제 뮤테이션 훅
 */
export function useDeleteUnifiedMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      userId,
      guestToken,
    }: {
      id: string
      userId: string | null
      guestToken: string | null
    }) => meditationRepository.delete(id, userId, guestToken),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.lists(),
      })
    },
  })
}

/**
 * 좋아요 토글 뮤테이션 훅 (옵티미스틱 업데이트)
 */
export function useToggleUnifiedMeditationLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      meditationId,
      userId,
      guestToken,
    }: {
      meditationId: string
      userId: string | null
      guestToken: string | null
    }) => meditationRepository.toggleLike(meditationId, userId, guestToken),

    // 옵티미스틱 업데이트
    onMutate: async ({ meditationId }) => {
      await queryClient.cancelQueries({ queryKey: unifiedMeditationKeys.lists() })

      // 모든 관련 쿼리의 스냅샷 저장
      const previousData = queryClient.getQueriesData({
        queryKey: unifiedMeditationKeys.lists(),
      })

      // 옵티미스틱 업데이트 적용
      queryClient.setQueriesData(
        { queryKey: unifiedMeditationKeys.lists() },
        (old: UnifiedMeditationProps[] | undefined) => {
          if (!old) return old
          return old.map((meditation) => {
            if (meditation.id === meditationId) {
              const isCurrentlyLiked = meditation.isLiked
              return {
                ...meditation,
                isLiked: !isCurrentlyLiked,
                likesCount: isCurrentlyLiked
                  ? Math.max(0, meditation.likesCount - 1)
                  : meditation.likesCount + 1,
              }
            }
            return meditation
          })
        }
      )

      return { previousData }
    },

    onError: (_err, _variables, context) => {
      // 에러 시 롤백
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data)
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: unifiedMeditationKeys.lists() })
    },
  })
}

/**
 * 고정 토글 뮤테이션 훅
 */
export function useToggleUnifiedMeditationPin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (meditationId: string) => meditationRepository.togglePin(meditationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.lists(),
      })
    },
  })
}

/**
 * 답글 목록 조회 훅
 */
export function useUnifiedMeditationReplies(
  meditationId: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: unifiedMeditationKeys.replies(meditationId ?? ''),
    queryFn: () => meditationRepository.findReplies(meditationId!),
    enabled: (options?.enabled ?? true) && !!meditationId,
    staleTime: 1000 * 30,
  })
}

/**
 * 답글 생성 뮤테이션 훅
 */
export function useCreateUnifiedMeditationReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUnifiedMeditationReplyInput) =>
      meditationRepository.createReply(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.replies(data.meditationId),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.lists(),
      })
    },
  })
}

/**
 * 답글 삭제 뮤테이션 훅
 */
export function useDeleteUnifiedMeditationReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      meditationId,
      userId,
      guestToken,
    }: {
      id: string
      meditationId: string
      userId: string | null
      guestToken: string | null
    }) => meditationRepository.deleteReply(id, userId, guestToken),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.replies(variables.meditationId),
      })
      queryClient.invalidateQueries({
        queryKey: unifiedMeditationKeys.lists(),
      })
    },
  })
}

/**
 * 묵상 수 조회 훅
 */
export function useUnifiedMeditationCount(
  sourceType: SourceType,
  sourceId: string | null,
  dayNumber?: number | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: unifiedMeditationKeys.count(sourceType, sourceId ?? '', dayNumber),
    queryFn: () => meditationRepository.getCount(sourceType, sourceId!, dayNumber),
    enabled: (options?.enabled ?? true) && !!sourceId,
    staleTime: 1000 * 60, // 1분
  })
}

// ============================================
// 그룹 통합 피드 전용 훅 (교회/메인 페이지 공용)
// ============================================

/**
 * 그룹 통합 피드 조회 훅
 *
 * 그룹의 묵상(free)과 QT(qt)를 모두 조회합니다.
 * 교회 그룹 페이지와 메인 그룹 페이지에서 동일하게 사용.
 *
 * @param groupId - 그룹 ID
 * @param options.viewMode - 'feed' (전체 피드) 또는 'day' (일자별)
 * @param options.currentDay - 일자별 모드일 때 현재 일차
 * @param options.contentTypeFilter - 'all' | 'free' | 'qt'
 * @param options.userId - 좋아요 상태 확인용
 */
export function useGroupUnifiedFeed(
  groupId: string | null,
  options?: {
    viewMode?: 'feed' | 'day'
    currentDay?: number
    contentTypeFilter?: 'all' | 'free' | 'qt'
    userId?: string | null
    limit?: number
    enabled?: boolean
  }
) {
  const {
    viewMode = 'feed',
    currentDay,
    contentTypeFilter = 'all',
    userId,
    limit = 50,
    enabled = true,
  } = options ?? {}

  // 'all'이면 contentType을 null로 (모든 타입 조회)
  const contentType: ContentType | null =
    contentTypeFilter === 'all' ? null : contentTypeFilter

  // 'feed' 모드면 dayNumber를 null로 (모든 날짜 조회)
  // currentDay가 undefined인 경우에도 null로 처리
  const dayNumber = viewMode === 'day' && currentDay !== undefined ? currentDay : null

  // 일자별 모드인데 currentDay가 없으면 비활성화
  const isEnabled = enabled && (viewMode === 'feed' || currentDay !== undefined)

  return useUnifiedMeditations('group', groupId, {
    dayNumber,
    contentType,
    userId,
    filter: 'all',
    limit,
    enabled: isEnabled,
  })
}

/**
 * 교회 통합 피드 조회 훅
 *
 * 교회의 묵상(free)과 QT(qt)를 모두 조회합니다.
 *
 * @param churchId - 교회 ID
 * @param options.viewMode - 'feed' (전체 피드) 또는 'day' (일자별)
 * @param options.currentDay - 일자별 모드일 때 현재 일차
 * @param options.contentTypeFilter - 'all' | 'free' | 'qt'
 * @param options.userId - 좋아요 상태 확인용
 */
export function useChurchUnifiedFeed(
  churchId: string | null,
  options?: {
    viewMode?: 'feed' | 'day'
    currentDay?: number
    contentTypeFilter?: 'all' | 'free' | 'qt'
    userId?: string | null
    limit?: number
    enabled?: boolean
  }
) {
  const {
    viewMode = 'feed',
    currentDay,
    contentTypeFilter = 'all',
    userId,
    limit = 50,
    enabled = true,
  } = options ?? {}

  const contentType: ContentType | null =
    contentTypeFilter === 'all' ? null : contentTypeFilter

  // currentDay가 undefined인 경우에도 null로 처리
  const dayNumber = viewMode === 'day' && currentDay !== undefined ? currentDay : null

  // 일자별 모드인데 currentDay가 없으면 비활성화
  const isEnabled = enabled && (viewMode === 'feed' || currentDay !== undefined)

  return useUnifiedMeditations('church', churchId, {
    dayNumber,
    contentType,
    userId,
    filter: 'all',
    limit,
    enabled: isEnabled,
  })
}

/**
 * usePublicMeditation - 공개 묵상 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { SupabasePublicMeditationRepository } from '@/infrastructure/repositories/SupabasePublicMeditationRepository'
import {
  GetPublicMeditations,
  CreatePublicMeditation,
  UpdatePublicMeditation,
  DeletePublicMeditation,
  TogglePublicMeditationLike,
  GetProjectMeditations,
  GetDayMeditation,
  CreatePersonalMeditation,
  UpdatePersonalMeditation,
  DeletePersonalMeditation,
} from '@/application/use-cases/public-meditation'
import type {
  CreatePersonalMeditationInput,
  UpdatePersonalMeditationInput,
} from '@/application/use-cases/public-meditation'
import type { CreatePublicMeditationInput, UpdatePublicMeditationInput } from '@/domain/repositories/IPublicMeditationRepository'

// Query Keys
export const publicMeditationKeys = {
  all: ['public-meditations'] as const,
  lists: () => [...publicMeditationKeys.all, 'list'] as const,
  list: (options: { userId?: string; followingUserIds?: string[] }) =>
    [...publicMeditationKeys.lists(), options] as const,
  popular: (options?: { limit?: number; daysAgo?: number }) =>
    [...publicMeditationKeys.all, 'popular', options] as const,
  details: () => [...publicMeditationKeys.all, 'detail'] as const,
  detail: (id: string) => [...publicMeditationKeys.details(), id] as const,
  replies: (id: string) => [...publicMeditationKeys.all, 'replies', id] as const,
  // 개인 프로젝트 관련 키
  project: (projectId: string) => [...publicMeditationKeys.all, 'project', projectId] as const,
  projectDay: (projectId: string, dayNumber: number) =>
    [...publicMeditationKeys.all, 'project', projectId, 'day', dayNumber] as const,
  // 사용자별 개인 묵상
  byUser: (userId: string) => [...publicMeditationKeys.all, 'user', userId] as const,
}

// 공개 묵상 목록 조회 (무한 스크롤)
export function usePublicMeditations(options?: {
  userId?: string
  followingUserIds?: string[]
  currentUserId?: string
  visibility?: ('private' | 'church' | 'public')[]
}) {
  return useInfiniteQuery({
    queryKey: publicMeditationKeys.list({
      userId: options?.userId,
      followingUserIds: options?.followingUserIds,
    }),
    queryFn: async ({ pageParam = 0 }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new GetPublicMeditations(repository)
      const data = await useCase.execute({
        limit: 20,
        offset: pageParam,
        userId: options?.userId,
        followingUserIds: options?.followingUserIds,
        currentUserId: options?.currentUserId,
        visibility: options?.visibility,
      })
      return {
        data,
        nextOffset: data.length === 20 ? pageParam + 20 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
  })
}

// 인기 묵상 조회 (좋아요 순)
export function usePopularMeditations(options?: {
  limit?: number
  currentUserId?: string
  daysAgo?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: publicMeditationKeys.popular({
      limit: options?.limit,
      daysAgo: options?.daysAgo,
    }),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.findPopular({
        limit: options?.limit ?? 10,
        currentUserId: options?.currentUserId,
        daysAgo: options?.daysAgo ?? 7,
      })
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 단일 공개 묵상 조회
export function usePublicMeditation(id: string, currentUserId?: string) {
  return useQuery({
    queryKey: publicMeditationKeys.detail(id),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.findById(id, currentUserId)
    },
    enabled: !!id,
  })
}

// 공개 묵상 생성
export function useCreatePublicMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePublicMeditationInput) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new CreatePublicMeditation(repository)
      return useCase.execute(input)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
    },
  })
}

// 공개 묵상 수정
export function useUpdatePublicMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      input,
    }: {
      id: string
      userId: string
      input: UpdatePublicMeditationInput
    }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new UpdatePublicMeditation(repository)
      return useCase.execute(id, userId, input)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.detail(data.id) })
    },
  })
}

// 공개 묵상 삭제
export function useDeletePublicMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new DeletePublicMeditation(repository)
      return useCase.execute(id, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
    },
  })
}

// 공개 묵상 좋아요 토글
export function useTogglePublicMeditationLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      meditationId,
      userId,
    }: {
      meditationId: string
      userId: string
    }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new TogglePublicMeditationLike(repository)
      return useCase.execute(meditationId, userId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.detail(variables.meditationId),
      })
    },
  })
}

// 댓글 조회
export function usePublicMeditationReplies(meditationId: string) {
  return useQuery({
    queryKey: publicMeditationKeys.replies(meditationId),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.findReplies(meditationId)
    },
    enabled: !!meditationId,
  })
}

// 댓글 생성
export function useCreatePublicMeditationReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meditationId: string
      userId: string
      content: string
      isAnonymous?: boolean
      parentReplyId?: string | null
      mentionUserId?: string | null
      mentionNickname?: string | null
    }) => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.createReply(input)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.replies(data.meditationId),
      })
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
    },
  })
}

// 댓글 삭제
export function useDeletePublicMeditationReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      replyId,
      userId,
    }: {
      replyId: string
      userId: string
      meditationId: string
    }) => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.deleteReply(replyId, userId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.replies(variables.meditationId),
      })
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
    },
  })
}

// ============================================================================
// 개인 프로젝트 묵상 훅
// ============================================================================

// 사용자의 모든 개인 묵상 조회 (마이페이지용)
export function useUserPersonalMeditations(
  userId: string | null,
  options?: { limit?: number; offset?: number; enabled?: boolean }
) {
  return useQuery({
    queryKey: publicMeditationKeys.byUser(userId ?? ''),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      return repository.findByUserId(userId!, {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        currentUserId: userId!,
      })
    },
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 30,
  })
}

// 프로젝트별 묵상 목록 조회
export function useProjectMeditations(
  projectId: string,
  options?: { limit?: number; offset?: number; currentUserId?: string }
) {
  return useQuery({
    queryKey: publicMeditationKeys.project(projectId),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new GetProjectMeditations(repository)
      const result = await useCase.execute({
        projectId,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
        currentUserId: options?.currentUserId,
      })
      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: !!projectId,
  })
}

// 특정 Day 묵상 조회
export function useDayMeditation(
  projectId: string,
  dayNumber: number,
  currentUserId?: string
) {
  return useQuery({
    queryKey: publicMeditationKeys.projectDay(projectId, dayNumber),
    queryFn: async () => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new GetDayMeditation(repository)
      const result = await useCase.execute({
        projectId,
        dayNumber,
        currentUserId,
      })
      if (result.error) throw new Error(result.error)
      return result.meditation
    },
    enabled: !!projectId && dayNumber > 0,
  })
}

// 개인 묵상 생성
export function useCreatePersonalMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePersonalMeditationInput) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new CreatePersonalMeditation(repository)
      const result = await useCase.execute(input)
      if (result.error) throw new Error(result.error)
      return result.meditation
    },
    onSuccess: (_, variables) => {
      // 프로젝트 목록 갱신
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.project(variables.projectId),
      })
      // 특정 Day 캐시 갱신
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.projectDay(variables.projectId, variables.dayNumber),
      })
      // 공개 글인 경우 전체 목록도 갱신
      if (variables.visibility === 'public') {
        queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
      }
    },
  })
}

// 개인 묵상 수정
export function useUpdatePersonalMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePersonalMeditationInput & { projectId?: string }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new UpdatePersonalMeditation(repository)
      const result = await useCase.execute(input)
      if (result.error) throw new Error(result.error)
      return result.meditation
    },
    onSuccess: (meditation, variables) => {
      // 상세 캐시 갱신
      if (meditation) {
        queryClient.invalidateQueries({
          queryKey: publicMeditationKeys.detail(meditation.id),
        })
        // 프로젝트 목록 갱신
        if (meditation.projectId) {
          queryClient.invalidateQueries({
            queryKey: publicMeditationKeys.project(meditation.projectId),
          })
        }
      }
      // 전체 목록 갱신
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
      // 프로젝트별 목록 갱신
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: publicMeditationKeys.project(variables.projectId),
        })
      }
    },
  })
}

// 개인 묵상 삭제
export function useDeletePersonalMeditation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { id: string; userId: string; projectId?: string }) => {
      const repository = new SupabasePublicMeditationRepository()
      const useCase = new DeletePersonalMeditation(repository)
      const result = await useCase.execute({ id: input.id, userId: input.userId })
      if (result.error) throw new Error(result.error)
      return result.success
    },
    onSuccess: (_, variables) => {
      // 상세 캐시 갱신
      queryClient.invalidateQueries({
        queryKey: publicMeditationKeys.detail(variables.id),
      })
      // 프로젝트 목록 갱신
      if (variables.projectId) {
        queryClient.invalidateQueries({
          queryKey: publicMeditationKeys.project(variables.projectId),
        })
      }
      // 전체 목록 갱신
      queryClient.invalidateQueries({ queryKey: publicMeditationKeys.lists() })
    },
  })
}

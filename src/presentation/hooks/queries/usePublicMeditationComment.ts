'use client'

/**
 * Public Meditation Comment React Query Hooks
 *
 * 공개 묵상 댓글 관련 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { MeditationType } from '@/domain/entities/PublicMeditationComment'
import { SupabasePublicMeditationCommentRepository } from '@/infrastructure/repositories/SupabasePublicMeditationCommentRepository'
import {
  CreatePublicMeditationComment,
  GetPublicMeditationComments,
  DeletePublicMeditationComment,
  TogglePublicMeditationCommentLike,
} from '@/application/use-cases/public-meditation-comment'

// Query Key Factory
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (meditationId: string, meditationType: MeditationType, parentId?: string | null) =>
    [...commentKeys.lists(), meditationId, meditationType, parentId] as const,
  detail: (id: string) => [...commentKeys.all, 'detail', id] as const,
  count: (meditationId: string, meditationType: MeditationType) =>
    [...commentKeys.all, 'count', meditationId, meditationType] as const,
}

// Repository 인스턴스
const commentRepository = new SupabasePublicMeditationCommentRepository()

// Use Case 인스턴스
const createComment = new CreatePublicMeditationComment(commentRepository)
const getComments = new GetPublicMeditationComments(commentRepository)
const deleteComment = new DeletePublicMeditationComment(commentRepository)
const toggleCommentLike = new TogglePublicMeditationCommentLike(commentRepository)

/**
 * 댓글 목록 조회 훅 (무한 스크롤)
 */
export function useComments(
  meditationId: string,
  meditationType: MeditationType,
  currentUserId?: string,
  parentId?: string | null
) {
  return useInfiniteQuery({
    queryKey: commentKeys.list(meditationId, meditationType, parentId),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getComments.execute({
        meditationId,
        meditationType,
        currentUserId,
        parentId,
        limit: 20,
        offset: pageParam,
      })

      if (result.error) throw new Error(result.error)

      return {
        data: result.comments,
        totalCount: result.totalCount,
        nextOffset: result.hasMore ? pageParam + 20 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!meditationId && !!meditationType,
  })
}

/**
 * 댓글 수 조회 훅
 */
export function useCommentsCount(meditationId: string, meditationType: MeditationType) {
  return useQuery({
    queryKey: commentKeys.count(meditationId, meditationType),
    queryFn: async () => {
      return await commentRepository.getCommentsCount(meditationId, meditationType)
    },
    enabled: !!meditationId && !!meditationType,
  })
}

/**
 * 댓글 작성 뮤테이션 훅
 */
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      meditationId: string
      meditationType: MeditationType
      userId: string
      content: string
      isAnonymous?: boolean
      parentId?: string | null
    }) => {
      const result = await createComment.execute(input)
      if (result.error) throw new Error(result.error)
      return result.comment
    },
    onSuccess: (_, variables) => {
      // 댓글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.meditationId, variables.meditationType, null),
      })
      // 답글인 경우 부모 댓글의 답글 목록도 무효화
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.list(variables.meditationId, variables.meditationType, variables.parentId),
        })
      }
      // 댓글 수 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.count(variables.meditationId, variables.meditationType),
      })
    },
  })
}

/**
 * 댓글 삭제 뮤테이션 훅
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      commentId: string
      userId: string
      meditationId: string
      meditationType: MeditationType
      parentId?: string | null
    }) => {
      const result = await deleteComment.execute({
        commentId: input.commentId,
        userId: input.userId,
      })
      if (!result.success) throw new Error(result.error ?? '삭제 실패')
      return true
    },
    onSuccess: (_, variables) => {
      // 댓글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.meditationId, variables.meditationType, null),
      })
      // 답글인 경우 부모 댓글의 답글 목록도 무효화
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.list(variables.meditationId, variables.meditationType, variables.parentId),
        })
      }
      // 댓글 수 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.count(variables.meditationId, variables.meditationType),
      })
    },
  })
}

/**
 * 댓글 좋아요 토글 뮤테이션 훅
 */
export function useToggleCommentLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      commentId: string
      userId: string
      meditationId: string
      meditationType: MeditationType
    }) => {
      const result = await toggleCommentLike.execute({
        commentId: input.commentId,
        userId: input.userId,
      })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (_, variables) => {
      // 댓글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.list(variables.meditationId, variables.meditationType, null),
      })
    },
  })
}

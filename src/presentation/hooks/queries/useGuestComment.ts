'use client'

/**
 * Guest Comment React Query Hooks
 *
 * 교회 게스트 댓글 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetGuestComments } from '@/application/use-cases/guest-comment/GetGuestComments'
import { CreateGuestComment } from '@/application/use-cases/guest-comment/CreateGuestComment'
import { UpdateGuestComment } from '@/application/use-cases/guest-comment/UpdateGuestComment'
import { DeleteGuestComment } from '@/application/use-cases/guest-comment/DeleteGuestComment'
import { ToggleGuestCommentLike } from '@/application/use-cases/guest-comment/ToggleGuestCommentLike'
import { GetGuestCommentReplies } from '@/application/use-cases/guest-comment/GetGuestCommentReplies'
import { CreateGuestCommentReply } from '@/application/use-cases/guest-comment/CreateGuestCommentReply'
import { DeleteGuestCommentReply } from '@/application/use-cases/guest-comment/DeleteGuestCommentReply'
import { SupabaseGuestCommentRepository } from '@/infrastructure/repositories/SupabaseGuestCommentRepository'
import { CreateGuestCommentInput, UpdateGuestCommentInput, CreateGuestCommentReplyInput } from '@/domain/entities/GuestComment'

// Query Key Factory
export const guestCommentKeys = {
  all: ['guestComment'] as const,
  byChurchId: (churchId: string) => [...guestCommentKeys.all, 'church', churchId] as const,
  byChurchIdAndDay: (churchId: string, dayNumber: number | null) =>
    [...guestCommentKeys.all, 'church', churchId, 'day', dayNumber] as const,
  replies: (commentId: string) => [...guestCommentKeys.all, 'replies', commentId] as const,
}

// Repository 인스턴스 (싱글톤)
const guestCommentRepository = new SupabaseGuestCommentRepository()

/**
 * 교회 게스트 댓글 목록 조회 훅
 */
export function useGuestComments(
  churchId: string | null,
  options?: {
    dayNumber?: number | null
    limit?: number
    offset?: number
    userId?: string | null
    enabled?: boolean
  }
) {
  const getGuestComments = new GetGuestComments(guestCommentRepository)

  return useQuery({
    queryKey: guestCommentKeys.byChurchIdAndDay(churchId ?? '', options?.dayNumber ?? null),
    queryFn: async () => {
      if (!churchId) return { comments: [], error: null }

      const result = await getGuestComments.execute({
        churchId,
        dayNumber: options?.dayNumber,
        limit: options?.limit,
        offset: options?.offset,
        userId: options?.userId,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!churchId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 게스트 댓글 생성 뮤테이션 훅
 */
export function useCreateGuestComment(churchId: string) {
  const queryClient = useQueryClient()
  const createGuestComment = new CreateGuestComment(guestCommentRepository)

  return useMutation({
    mutationFn: async (input: CreateGuestCommentInput) => {
      const result = await createGuestComment.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 교회의 댓글 캐시 무효화
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

/**
 * 게스트 댓글 수정 뮤테이션 훅
 */
export function useUpdateGuestComment(churchId: string) {
  const queryClient = useQueryClient()
  const updateGuestComment = new UpdateGuestComment(guestCommentRepository)

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateGuestCommentInput }) => {
      const result = await updateGuestComment.execute({ id, input })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

/**
 * 게스트 댓글 삭제 뮤테이션 훅
 */
export function useDeleteGuestComment(churchId: string) {
  const queryClient = useQueryClient()
  const deleteGuestComment = new DeleteGuestComment(guestCommentRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGuestComment.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

/**
 * 게스트 댓글 좋아요 토글 뮤테이션 훅
 */
export function useToggleGuestCommentLike(churchId: string) {
  const queryClient = useQueryClient()
  const toggleGuestCommentLike = new ToggleGuestCommentLike(guestCommentRepository)

  return useMutation({
    mutationFn: async ({ commentId, userId }: { commentId: string; userId: string }) => {
      const result = await toggleGuestCommentLike.execute({ commentId, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

/**
 * 게스트 댓글 답글 목록 조회 훅
 */
export function useGuestCommentReplies(
  commentId: string | null,
  options?: { enabled?: boolean }
) {
  const getGuestCommentReplies = new GetGuestCommentReplies(guestCommentRepository)

  return useQuery({
    queryKey: guestCommentKeys.replies(commentId ?? ''),
    queryFn: async () => {
      if (!commentId) return { replies: [], error: null }

      const result = await getGuestCommentReplies.execute({ commentId })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!commentId,
    staleTime: 1000 * 60 * 1, // 1분
  })
}

/**
 * 게스트 댓글 답글 생성 뮤테이션 훅
 */
export function useCreateGuestCommentReply(churchId: string, commentId: string) {
  const queryClient = useQueryClient()
  const createGuestCommentReply = new CreateGuestCommentReply(guestCommentRepository)

  return useMutation({
    mutationFn: async (input: Omit<CreateGuestCommentReplyInput, 'commentId'>) => {
      const result = await createGuestCommentReply.execute({ ...input, commentId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 답글 캐시와 댓글 캐시 모두 무효화 (답글 수 업데이트)
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.replies(commentId) })
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

/**
 * 게스트 댓글 답글 삭제 뮤테이션 훅
 */
export function useDeleteGuestCommentReply(churchId: string, commentId: string) {
  const queryClient = useQueryClient()
  const deleteGuestCommentReply = new DeleteGuestCommentReply(guestCommentRepository)

  return useMutation({
    mutationFn: async (replyId: string) => {
      const result = await deleteGuestCommentReply.execute({ replyId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 답글 캐시와 댓글 캐시 모두 무효화 (답글 수 업데이트)
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.replies(commentId) })
      queryClient.invalidateQueries({ queryKey: guestCommentKeys.byChurchId(churchId) })
    },
  })
}

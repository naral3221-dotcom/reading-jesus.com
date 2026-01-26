'use client'

/**
 * CommentReply React Query Hooks
 *
 * 묵상 댓글 답글 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetCommentReplies } from '@/application/use-cases/comment-reply/GetCommentReplies'
import { CreateCommentReply } from '@/application/use-cases/comment-reply/CreateCommentReply'
import { DeleteCommentReply } from '@/application/use-cases/comment-reply/DeleteCommentReply'
import { SupabaseCommentReplyRepository } from '@/infrastructure/repositories/SupabaseCommentReplyRepository'
import { CreateCommentReplyInput } from '@/domain/entities/CommentReply'

// Query Key Factory
export const commentReplyKeys = {
  all: ['commentReply'] as const,
  byCommentId: (commentId: string) => [...commentReplyKeys.all, 'comment', commentId] as const,
}

// Repository 인스턴스 (싱글톤)
const commentReplyRepository = new SupabaseCommentReplyRepository()

/**
 * 댓글 답글 목록 조회 훅
 */
export function useCommentReplies(
  commentId: string | null,
  options?: { enabled?: boolean }
) {
  const getCommentReplies = new GetCommentReplies(commentReplyRepository)

  return useQuery({
    queryKey: commentReplyKeys.byCommentId(commentId ?? ''),
    queryFn: async () => {
      if (!commentId) return { replies: [], error: null }

      const result = await getCommentReplies.execute({ commentId })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!commentId,
    staleTime: 1000 * 60 * 1, // 1분
  })
}

/**
 * 답글 생성 뮤테이션 훅
 */
export function useCreateCommentReply(commentId: string) {
  const queryClient = useQueryClient()
  const createCommentReply = new CreateCommentReply(commentReplyRepository)

  return useMutation({
    mutationFn: async (input: Omit<CreateCommentReplyInput, 'commentId'>) => {
      const result = await createCommentReply.execute({ ...input, commentId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentReplyKeys.byCommentId(commentId) })
    },
  })
}

/**
 * 답글 삭제 뮤테이션 훅
 */
export function useDeleteCommentReply(commentId: string) {
  const queryClient = useQueryClient()
  const deleteCommentReply = new DeleteCommentReply(commentReplyRepository)

  return useMutation({
    mutationFn: async ({ replyId, userId }: { replyId: string; userId: string }) => {
      const result = await deleteCommentReply.execute({ replyId, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentReplyKeys.byCommentId(commentId) })
    },
  })
}

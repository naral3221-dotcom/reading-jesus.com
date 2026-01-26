'use client'

/**
 * Church QT Post React Query Hooks
 *
 * 교회 QT 나눔 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetChurchQTPosts } from '@/application/use-cases/church-qt-post/GetChurchQTPosts'
import { CreateChurchQTPost } from '@/application/use-cases/church-qt-post/CreateChurchQTPost'
import { UpdateChurchQTPost } from '@/application/use-cases/church-qt-post/UpdateChurchQTPost'
import { DeleteChurchQTPost } from '@/application/use-cases/church-qt-post/DeleteChurchQTPost'
import { ToggleChurchQTPostLike } from '@/application/use-cases/church-qt-post/ToggleChurchQTPostLike'
import { GetChurchQTPostReplies } from '@/application/use-cases/church-qt-post/GetChurchQTPostReplies'
import { CreateChurchQTPostReply } from '@/application/use-cases/church-qt-post/CreateChurchQTPostReply'
import { DeleteChurchQTPostReply } from '@/application/use-cases/church-qt-post/DeleteChurchQTPostReply'
import { SupabaseChurchQTPostRepository } from '@/infrastructure/repositories/SupabaseChurchQTPostRepository'
import { SupabaseReadingCheckRepository } from '@/infrastructure/repositories/SupabaseReadingCheckRepository'
import { CreateChurchQTPostInput, UpdateChurchQTPostInput, CreateChurchQTPostReplyInput } from '@/domain/entities/ChurchQTPost'
import { readingCheckKeys } from './useReadingCheck'

// Query Key Factory
export const churchQTPostKeys = {
  all: ['churchQTPost'] as const,
  byChurchId: (churchId: string) => [...churchQTPostKeys.all, 'church', churchId] as const,
  byChurchIdAndDay: (churchId: string, dayNumber: number | null) =>
    [...churchQTPostKeys.all, 'church', churchId, 'day', dayNumber] as const,
  byChurchIdAndDate: (churchId: string, qtDate: string | null) =>
    [...churchQTPostKeys.all, 'church', churchId, 'date', qtDate] as const,
  replies: (postId: string) => [...churchQTPostKeys.all, 'replies', postId] as const,
}

// Repository 인스턴스 (싱글톤)
const churchQTPostRepository = new SupabaseChurchQTPostRepository()
const readingCheckRepository = new SupabaseReadingCheckRepository()

/**
 * 교회 QT 나눔 목록 조회 훅
 */
export function useChurchQTPosts(
  churchId: string | null,
  options?: {
    dayNumber?: number | null
    qtDate?: string | null
    limit?: number
    offset?: number
    userId?: string | null
    enabled?: boolean
  }
) {
  const getChurchQTPosts = new GetChurchQTPosts(churchQTPostRepository)

  return useQuery({
    queryKey: options?.qtDate
      ? churchQTPostKeys.byChurchIdAndDate(churchId ?? '', options.qtDate)
      : churchQTPostKeys.byChurchIdAndDay(churchId ?? '', options?.dayNumber ?? null),
    queryFn: async () => {
      if (!churchId) return { posts: [], error: null }

      const result = await getChurchQTPosts.execute({
        churchId,
        dayNumber: options?.dayNumber,
        qtDate: options?.qtDate,
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
 * QT 나눔 생성 뮤테이션 훅
 * QT 나눔 생성 시 해당 날짜의 읽음 완료도 자동으로 처리됩니다.
 */
export function useCreateChurchQTPost(churchId: string) {
  const queryClient = useQueryClient()
  const createChurchQTPost = new CreateChurchQTPost(churchQTPostRepository, readingCheckRepository)

  return useMutation({
    mutationFn: async (input: CreateChurchQTPostInput) => {
      const result = await createChurchQTPost.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (_, variables) => {
      // 해당 교회의 QT 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })

      // 읽음 체크 캐시도 무효화 (자동 읽음 완료 처리 반영)
      if (variables.userId) {
        queryClient.invalidateQueries({
          queryKey: readingCheckKeys.byChurch(variables.userId, churchId),
        })
        queryClient.invalidateQueries({
          queryKey: readingCheckKeys.progress(variables.userId, { churchId }),
        })
        queryClient.invalidateQueries({
          queryKey: readingCheckKeys.streak(variables.userId, { churchId }),
        })
      }
    },
  })
}

/**
 * QT 나눔 수정 뮤테이션 훅
 */
export function useUpdateChurchQTPost(churchId: string) {
  const queryClient = useQueryClient()
  const updateChurchQTPost = new UpdateChurchQTPost(churchQTPostRepository)

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateChurchQTPostInput }) => {
      const result = await updateChurchQTPost.execute({ id, input })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })
    },
  })
}

/**
 * QT 나눔 삭제 뮤테이션 훅
 */
export function useDeleteChurchQTPost(churchId: string) {
  const queryClient = useQueryClient()
  const deleteChurchQTPost = new DeleteChurchQTPost(churchQTPostRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteChurchQTPost.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })
    },
  })
}

/**
 * QT 나눔 좋아요 토글 뮤테이션 훅
 */
export function useToggleChurchQTPostLike(churchId: string) {
  const queryClient = useQueryClient()
  const toggleChurchQTPostLike = new ToggleChurchQTPostLike(churchQTPostRepository)

  return useMutation({
    mutationFn: async ({ postId, userId }: { postId: string; userId: string }) => {
      const result = await toggleChurchQTPostLike.execute({ postId, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    // 옵티미스틱 업데이트: 즉시 UI 반영
    onMutate: async ({ postId }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })

      // 현재 캐시된 데이터 스냅샷 저장
      const previousData = queryClient.getQueriesData({ queryKey: churchQTPostKeys.byChurchId(churchId) })

      // 캐시 데이터 낙관적 업데이트
      queryClient.setQueriesData(
        { queryKey: churchQTPostKeys.byChurchId(churchId) },
        (oldData: { posts?: { id: string; isLiked?: boolean; likesCount?: number }[] } | undefined) => {
          if (!oldData?.posts) return oldData
          return {
            ...oldData,
            posts: oldData.posts.map((post) => {
              if (post.id === postId) {
                const newIsLiked = !post.isLiked
                return {
                  ...post,
                  isLiked: newIsLiked,
                  likesCount: newIsLiked
                    ? (post.likesCount ?? 0) + 1
                    : Math.max((post.likesCount ?? 0) - 1, 0),
                }
              }
              return post
            }),
          }
        }
      )

      return { previousData }
    },
    // 에러 시 롤백
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    // 성공/에러 후 서버 데이터로 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })
    },
  })
}

/**
 * QT 나눔 답글 목록 조회 훅
 */
export function useChurchQTPostReplies(
  postId: string | null,
  options?: { enabled?: boolean }
) {
  const getChurchQTPostReplies = new GetChurchQTPostReplies(churchQTPostRepository)

  return useQuery({
    queryKey: churchQTPostKeys.replies(postId ?? ''),
    queryFn: async () => {
      if (!postId) return { replies: [], error: null }

      const result = await getChurchQTPostReplies.execute({ postId })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!postId,
    staleTime: 1000 * 60 * 1, // 1분
  })
}

/**
 * QT 나눔 답글 생성 뮤테이션 훅
 */
export function useCreateChurchQTPostReply(churchId: string, postId: string) {
  const queryClient = useQueryClient()
  const createChurchQTPostReply = new CreateChurchQTPostReply(churchQTPostRepository)

  return useMutation({
    mutationFn: async (input: Omit<CreateChurchQTPostReplyInput, 'postId'>) => {
      const result = await createChurchQTPostReply.execute({ ...input, postId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 답글 캐시와 QT 캐시 모두 무효화 (답글 수 업데이트)
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.replies(postId) })
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })
    },
  })
}

/**
 * QT 나눔 답글 삭제 뮤테이션 훅
 */
export function useDeleteChurchQTPostReply(churchId: string, postId: string) {
  const queryClient = useQueryClient()
  const deleteChurchQTPostReply = new DeleteChurchQTPostReply(churchQTPostRepository)

  return useMutation({
    mutationFn: async (replyId: string) => {
      const result = await deleteChurchQTPostReply.execute({ replyId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 답글 캐시와 QT 캐시 모두 무효화 (답글 수 업데이트)
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.replies(postId) })
      queryClient.invalidateQueries({ queryKey: churchQTPostKeys.byChurchId(churchId) })
    },
  })
}

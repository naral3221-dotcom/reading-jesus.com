'use client'

/**
 * Comment React Query Hooks
 *
 * 그룹 묵상 댓글 관련 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseCommentRepository } from '@/infrastructure/repositories/SupabaseGroupMeditationRepository'
import {
  GetComments,
  CreateComment,
  UpdateComment,
  DeleteComment,
  ToggleCommentLike,
  ToggleCommentPin,
  GetCommentReplies,
  CreateCommentReply,
  DeleteCommentReply,
} from '@/application/use-cases/group-meditation'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { CommentSearchParams } from '@/domain/repositories/IGroupMeditationRepository'
import type { CreateCommentInput, UpdateCommentInput, CreateCommentReplyInput } from '@/domain/entities/GroupMeditation'
import type { CommentAttachment } from '@/types'

// 첨부파일 상수
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Query Key Factory
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (params: CommentSearchParams) => [...commentKeys.lists(), params] as const,
  detail: (id: string) => [...commentKeys.all, 'detail', id] as const,
  replies: (commentId: string) => [...commentKeys.all, 'replies', commentId] as const,
  userComments: (userId: string) => [...commentKeys.all, 'user', userId] as const,
  attachments: (commentId: string) => [...commentKeys.all, 'attachments', commentId] as const,
}

// Repository 인스턴스 (싱글톤)
const commentRepository = new SupabaseCommentRepository()

/**
 * 댓글 목록 조회 훅
 */
export function useComments(params: CommentSearchParams) {
  const getComments = new GetComments(commentRepository)

  return useQuery({
    queryKey: commentKeys.list(params),
    queryFn: async () => {
      const result = await getComments.execute(params)
      if (result.error) throw new Error(result.error)
      return result.comments
    },
    enabled: !!params.groupId && params.dayNumber > 0,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 댓글 생성 뮤테이션 훅
 */
export function useCreateComment() {
  const queryClient = useQueryClient()
  const createComment = new CreateComment(commentRepository)

  return useMutation({
    mutationFn: async (input: CreateCommentInput) => {
      const result = await createComment.execute(input)
      if (result.error) throw new Error(result.error)
      return result.comment
    },
    onSuccess: () => {
      // 해당 그룹/Day의 댓글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 댓글 수정 뮤테이션 훅
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()
  const updateComment = new UpdateComment(commentRepository)

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      input,
    }: {
      id: string
      userId: string
      input: UpdateCommentInput
    }) => {
      const result = await updateComment.execute(id, userId, input)
      if (result.error) throw new Error(result.error)
      return result.comment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 댓글 삭제 뮤테이션 훅
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()
  const deleteComment = new DeleteComment(commentRepository)

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await deleteComment.execute(id, userId)
      if (result.error) throw new Error(result.error)
      return result.success
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 좋아요 토글 뮤테이션 훅 (옵티미스틱 업데이트 적용)
 */
export function useToggleCommentLike() {
  const queryClient = useQueryClient()
  const toggleLike = new ToggleCommentLike(commentRepository)

  return useMutation({
    mutationFn: async ({ commentId, userId }: { commentId: string; userId: string }) => {
      const result = await toggleLike.execute(commentId, userId)
      if (result.error) throw new Error(result.error)
      return result.isLiked
    },
    // 옵티미스틱 업데이트: 즉시 UI 반영
    onMutate: async ({ commentId }) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: commentKeys.lists() })

      // 현재 캐시된 데이터 스냅샷 저장
      const previousData = queryClient.getQueriesData({ queryKey: commentKeys.lists() })

      // 캐시 데이터 낙관적 업데이트
      queryClient.setQueriesData(
        { queryKey: commentKeys.lists() },
        (oldData: { id: string; isLiked?: boolean; likesCount?: number }[] | undefined) => {
          if (!oldData) return oldData
          return oldData.map((comment) => {
            if (comment.id === commentId) {
              const newIsLiked = !comment.isLiked
              return {
                ...comment,
                isLiked: newIsLiked,
                likesCount: newIsLiked
                  ? (comment.likesCount ?? 0) + 1
                  : Math.max((comment.likesCount ?? 0) - 1, 0),
              }
            }
            return comment
          })
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
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 고정 토글 뮤테이션 훅
 */
export function useToggleCommentPin() {
  const queryClient = useQueryClient()
  const togglePin = new ToggleCommentPin(commentRepository)

  return useMutation({
    mutationFn: async (commentId: string) => {
      const result = await togglePin.execute(commentId)
      if (result.error) throw new Error(result.error)
      return result.isPinned
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 댓글 답글 조회 훅
 */
export function useCommentReplies(commentId: string | null) {
  const getReplies = new GetCommentReplies(commentRepository)

  return useQuery({
    queryKey: commentKeys.replies(commentId ?? ''),
    queryFn: async () => {
      if (!commentId) return []
      const result = await getReplies.execute(commentId)
      if (result.error) throw new Error(result.error)
      return result.replies
    },
    enabled: !!commentId,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 답글 생성 뮤테이션 훅
 */
export function useCreateCommentReply() {
  const queryClient = useQueryClient()
  const createReply = new CreateCommentReply(commentRepository)

  return useMutation({
    mutationFn: async (input: CreateCommentReplyInput) => {
      const result = await createReply.execute(input)
      if (result.error) throw new Error(result.error)
      return result.reply
    },
    onSuccess: (_, variables) => {
      // 해당 댓글의 답글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.replies(variables.commentId),
      })
      // 댓글 목록도 무효화 (repliesCount 업데이트)
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 답글 삭제 뮤테이션 훅
 */
export function useDeleteCommentReply() {
  const queryClient = useQueryClient()
  const deleteReply = new DeleteCommentReply(commentRepository)

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      commentId: _commentId,
    }: {
      id: string
      userId: string
      commentId: string
    }) => {
      const result = await deleteReply.execute(id, userId)
      if (result.error) throw new Error(result.error)
      return { success: result.success, commentId: _commentId }
    },
    onSuccess: (data) => {
      // 해당 댓글의 답글 목록 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.replies(data.commentId),
      })
      // 댓글 목록도 무효화 (repliesCount 업데이트)
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 무한 스크롤용 댓글 조회 훅
 */
export function useInfiniteComments(
  groupId: string | null,
  dayNumber: number,
  userId: string | null,
  filter: 'all' | 'mine' | 'pinned' = 'all'
) {
  const getComments = new GetComments(commentRepository)
  const pageSize = 15

  return useQuery({
    queryKey: commentKeys.list({ groupId: groupId ?? '', dayNumber, userId: userId ?? undefined, filter }),
    queryFn: async () => {
      if (!groupId) return []
      const result = await getComments.execute({
        groupId,
        dayNumber,
        userId: userId ?? undefined,
        filter,
        limit: pageSize,
        offset: 0,
      })
      if (result.error) throw new Error(result.error)
      return result.comments
    },
    enabled: !!groupId && dayNumber > 0,
    staleTime: 1000 * 30,
  })
}

/**
 * 그룹 피드용 댓글(묵상) 조회 훅
 * - 특정 그룹의 모든 최근 묵상을 가져옵니다
 * - dayNumber 필터 없이 그룹 전체 피드를 조회합니다
 */
export function useGroupFeed(
  groupId: string | null,
  options?: {
    limit?: number
    enabled?: boolean
  }
) {
  const limit = options?.limit ?? 50

  return useQuery({
    queryKey: [...commentKeys.all, 'groupFeed', groupId, limit] as const,
    queryFn: async () => {
      if (!groupId) return []

      const supabase = getSupabaseBrowserClient()

      // unified_meditations에서 그룹 피드 조회 (Phase 4 마이그레이션)
      const { data, error } = await supabase
        .from('unified_meditations')
        .select('*')
        .eq('source_type', 'group')
        .eq('source_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      // 프로필 정보를 별도 조회
      const userIds = Array.from(new Set((data || []).map(d => d.user_id).filter(Boolean)))
      let profileMap: Record<string, { nickname: string; avatar_url: string | null }> = {}

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', userIds as string[])

        profileMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = { nickname: p.nickname, avatar_url: p.avatar_url }
          return acc
        }, {} as Record<string, { nickname: string; avatar_url: string | null }>)
      }

      // 기존 형식에 맞게 데이터 변환
      return (data || []).map(row => ({
        id: row.legacy_id || row.id,
        group_id: row.source_id,
        user_id: row.user_id,
        day_number: row.day_number,
        content: row.content,
        bible_range: row.bible_range,
        is_public: row.visibility === 'public',
        is_anonymous: row.is_anonymous,
        likes_count: row.likes_count || 0,
        replies_count: row.replies_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profile: row.user_id ? profileMap[row.user_id] : null,
        legacy_id: row.legacy_id,
        legacy_table: row.legacy_table,
      }))
    },
    enabled: options?.enabled !== false && !!groupId,
    staleTime: 1000 * 30, // 30초
  })
}

// =============================================
// 첨부파일 관련 훅
// =============================================

/**
 * 첨부파일 업로드 입력 타입
 */
export interface UploadCommentAttachmentsInput {
  commentId: string
  userId: string
  files: File[]
}

/**
 * 첨부파일 업로드 결과 타입
 */
export interface UploadAttachmentResult {
  success: boolean
  fileUrl: string | null
  fileName: string
  error?: string
}

/**
 * 댓글 첨부파일 업로드 뮤테이션 훅
 *
 * Storage에 파일 업로드 후 DB에 첨부파일 정보를 저장합니다.
 */
export function useUploadCommentAttachments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commentId,
      userId,
      files,
    }: UploadCommentAttachmentsInput): Promise<UploadAttachmentResult[]> => {
      if (!userId || files.length === 0) {
        return []
      }

      const supabase = getSupabaseBrowserClient()

      const uploadPromises = files.map(async (file): Promise<UploadAttachmentResult> => {
        try {
          // 파일 확장자 추출
          const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
          // 고유한 파일명 생성: userId/commentId/timestamp_randomString.ext
          const fileName = `${userId}/${commentId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

          // Storage에 파일 업로드
          const { error: uploadError } = await supabase.storage
            .from('comment_attachments')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) {
            console.error('Upload error:', uploadError)
            return {
              success: false,
              fileUrl: null,
              fileName: file.name,
              error: uploadError.message,
            }
          }

          // Public URL 가져오기
          const { data: { publicUrl } } = supabase.storage
            .from('comment_attachments')
            .getPublicUrl(fileName)

          // 파일 타입 결정 (이미지 또는 PDF)
          const fileType: 'image' | 'pdf' = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'pdf'

          // DB에 첨부파일 정보 저장
          const { error: dbError } = await supabase
            .from('comment_attachments')
            .insert({
              comment_id: commentId,
              user_id: userId,
              file_url: publicUrl,
              file_type: fileType,
              file_name: file.name,
              file_size: file.size,
            })

          if (dbError) {
            console.error('DB insert error:', dbError)
            // DB 저장 실패 시 Storage에서 파일 삭제 시도 (롤백)
            await supabase.storage
              .from('comment_attachments')
              .remove([fileName])

            return {
              success: false,
              fileUrl: null,
              fileName: file.name,
              error: dbError.message,
            }
          }

          return {
            success: true,
            fileUrl: publicUrl,
            fileName: file.name,
          }
        } catch (error) {
          console.error('Unexpected upload error:', error)
          return {
            success: false,
            fileUrl: null,
            fileName: file.name,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
          }
        }
      })

      return Promise.all(uploadPromises)
    },
    onSuccess: (_, variables) => {
      // 해당 댓글의 첨부파일 목록 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.attachments(variables.commentId),
      })
      // 댓글 목록도 무효화 (첨부파일 포함된 댓글 목록 갱신)
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

/**
 * 댓글의 첨부파일 목록 조회 훅
 */
export function useCommentAttachments(commentId: string | null) {
  return useQuery({
    queryKey: commentKeys.attachments(commentId ?? ''),
    queryFn: async (): Promise<CommentAttachment[]> => {
      if (!commentId) return []

      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('comment_attachments')
        .select('*')
        .eq('comment_id', commentId)
        .order('created_at', { ascending: true })

      if (error) {
        // 테이블이 없는 경우 빈 배열 반환
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          return []
        }
        throw new Error(error.message)
      }

      return data as CommentAttachment[]
    },
    enabled: !!commentId,
    staleTime: 1000 * 60, // 1분
  })
}

/**
 * 첨부파일 삭제 입력 타입
 */
export interface DeleteCommentAttachmentInput {
  attachmentId: string
  userId: string
  commentId: string
  fileUrl: string
}

/**
 * 댓글 첨부파일 삭제 뮤테이션 훅
 *
 * DB에서 첨부파일 정보 삭제 후 Storage에서 파일을 삭제합니다.
 */
export function useDeleteCommentAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attachmentId,
      userId,
      fileUrl,
    }: DeleteCommentAttachmentInput): Promise<boolean> => {
      const supabase = getSupabaseBrowserClient()

      // DB에서 첨부파일 정보 삭제 (본인 것만 삭제 가능)
      const { error: dbError } = await supabase
        .from('comment_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('user_id', userId)

      if (dbError) {
        throw new Error(dbError.message)
      }

      // Storage에서 파일 삭제
      // URL에서 파일 경로 추출: publicUrl 형식 - .../comment_attachments/{userId}/{commentId}/{fileName}
      try {
        const url = new URL(fileUrl)
        const pathParts = url.pathname.split('/comment_attachments/')
        if (pathParts.length > 1) {
          const filePath = pathParts[1]
          await supabase.storage
            .from('comment_attachments')
            .remove([filePath])
        }
      } catch (storageError) {
        // Storage 삭제 실패해도 DB는 이미 삭제됨 - 로그만 남김
        console.error('Storage delete error:', storageError)
      }

      return true
    },
    onSuccess: (_, variables) => {
      // 해당 댓글의 첨부파일 목록 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.attachments(variables.commentId),
      })
      // 댓글 목록도 무효화
      queryClient.invalidateQueries({
        queryKey: commentKeys.lists(),
      })
    },
  })
}

// ===== 새 명명 체계 별칭 =====

/** groupMeditationKeys = commentKeys */
export const groupMeditationKeys = commentKeys

/** useGroupMeditations = useComments */
export const useGroupMeditations = useComments

/** useCreateGroupMeditation = useCreateComment */
export const useCreateGroupMeditation = useCreateComment

/** useUpdateGroupMeditation = useUpdateComment */
export const useUpdateGroupMeditation = useUpdateComment

/** useDeleteGroupMeditation = useDeleteComment */
export const useDeleteGroupMeditation = useDeleteComment

/** useToggleGroupMeditationLike = useToggleCommentLike */
export const useToggleGroupMeditationLike = useToggleCommentLike

/** useToggleGroupMeditationPin = useToggleCommentPin */
export const useToggleGroupMeditationPin = useToggleCommentPin

/** useGroupMeditationReplies = useCommentReplies */
export const useGroupMeditationReplies = useCommentReplies

/** useCreateGroupMeditationReply = useCreateCommentReply */
export const useCreateGroupMeditationReply = useCreateCommentReply

/** useDeleteGroupMeditationReply = useDeleteCommentReply */
export const useDeleteGroupMeditationReply = useDeleteCommentReply

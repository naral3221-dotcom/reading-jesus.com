'use client'

/**
 * Group Notice React Query Hooks
 *
 * 그룹 공지사항 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetGroupNotices } from '@/application/use-cases/group-notice/GetGroupNotices'
import { CreateGroupNotice } from '@/application/use-cases/group-notice/CreateGroupNotice'
import { UpdateGroupNotice, UpdateGroupNoticeInput } from '@/application/use-cases/group-notice/UpdateGroupNotice'
import { DeleteGroupNotice } from '@/application/use-cases/group-notice/DeleteGroupNotice'
import { SupabaseGroupNoticeRepository } from '@/infrastructure/repositories/SupabaseGroupNoticeRepository'
import { CreateGroupNoticeInput } from '@/domain/entities/GroupNotice'

// Query Key Factory
export const groupNoticeKeys = {
  all: ['groupNotice'] as const,
  byGroupId: (groupId: string) => [...groupNoticeKeys.all, 'group', groupId] as const,
  byId: (id: string) => [...groupNoticeKeys.all, 'id', id] as const,
}

// Repository 인스턴스 (싱글톤)
const noticeRepository = new SupabaseGroupNoticeRepository()

/**
 * 그룹 공지사항 목록 조회 훅
 */
export function useGroupNotices(
  groupId: string | null,
  options?: { limit?: number; offset?: number; enabled?: boolean }
) {
  const getGroupNotices = new GetGroupNotices(noticeRepository)

  return useQuery({
    queryKey: groupNoticeKeys.byGroupId(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) return { notices: [], error: null }

      const result = await getGroupNotices.execute({
        groupId,
        limit: options?.limit,
        offset: options?.offset,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!groupId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 공지사항 생성 뮤테이션 훅
 */
export function useCreateGroupNotice(groupId: string) {
  const queryClient = useQueryClient()
  const createGroupNotice = new CreateGroupNotice(noticeRepository)

  return useMutation({
    mutationFn: async (input: CreateGroupNoticeInput) => {
      const result = await createGroupNotice.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 그룹의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupNoticeKeys.byGroupId(groupId) })
    },
  })
}

/**
 * 공지사항 수정 뮤테이션 훅
 */
export function useUpdateGroupNotice(groupId: string) {
  const queryClient = useQueryClient()
  const updateGroupNotice = new UpdateGroupNotice(noticeRepository)

  return useMutation({
    mutationFn: async (input: UpdateGroupNoticeInput) => {
      const result = await updateGroupNotice.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 그룹의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupNoticeKeys.byGroupId(groupId) })
    },
  })
}

/**
 * 공지사항 삭제 뮤테이션 훅
 */
export function useDeleteGroupNotice(groupId: string) {
  const queryClient = useQueryClient()
  const deleteGroupNotice = new DeleteGroupNotice(noticeRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteGroupNotice.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 그룹의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupNoticeKeys.byGroupId(groupId) })
    },
  })
}

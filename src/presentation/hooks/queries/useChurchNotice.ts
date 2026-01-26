'use client'

/**
 * Church Notice React Query Hooks
 *
 * 교회 공지사항 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetChurchNotices } from '@/application/use-cases/church-notice/GetChurchNotices'
import { GetActiveChurchNotices } from '@/application/use-cases/church-notice/GetActiveChurchNotices'
import { CreateChurchNotice } from '@/application/use-cases/church-notice/CreateChurchNotice'
import { UpdateChurchNotice, UpdateChurchNoticeInput } from '@/application/use-cases/church-notice/UpdateChurchNotice'
import { DeleteChurchNotice } from '@/application/use-cases/church-notice/DeleteChurchNotice'
import { ToggleNoticePin } from '@/application/use-cases/church-notice/ToggleNoticePin'
import { ToggleNoticeActive } from '@/application/use-cases/church-notice/ToggleNoticeActive'
import { SupabaseChurchNoticeRepository } from '@/infrastructure/repositories/SupabaseChurchNoticeRepository'
import { CreateChurchNoticeInput } from '@/domain/entities/ChurchNotice'

// Query Key Factory
export const churchNoticeKeys = {
  all: ['churchNotice'] as const,
  byChurchId: (churchId: string) => [...churchNoticeKeys.all, 'church', churchId] as const,
  active: (churchId: string) => [...churchNoticeKeys.all, 'active', churchId] as const,
  byId: (id: string) => [...churchNoticeKeys.all, 'id', id] as const,
}

// Repository 인스턴스 (싱글톤)
const noticeRepository = new SupabaseChurchNoticeRepository()

/**
 * 교회 공지사항 목록 조회 훅 (관리자용)
 */
export function useChurchNotices(
  churchId: string | null,
  options?: { activeOnly?: boolean; limit?: number; offset?: number; enabled?: boolean }
) {
  const getChurchNotices = new GetChurchNotices(noticeRepository)

  return useQuery({
    queryKey: churchNoticeKeys.byChurchId(churchId ?? ''),
    queryFn: async () => {
      if (!churchId) return { notices: [], error: null }

      const result = await getChurchNotices.execute({
        churchId,
        activeOnly: options?.activeOnly,
        limit: options?.limit,
        offset: options?.offset,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!churchId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 활성화된 공지사항 조회 훅 (메인 페이지 배너용)
 */
export function useActiveChurchNotices(churchId: string | null, options?: { enabled?: boolean }) {
  const getActiveChurchNotices = new GetActiveChurchNotices(noticeRepository)

  return useQuery({
    queryKey: churchNoticeKeys.active(churchId ?? ''),
    queryFn: async () => {
      if (!churchId) return { notices: [], error: null }

      const result = await getActiveChurchNotices.execute({ churchId })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!churchId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 공지사항 생성 뮤테이션 훅
 */
export function useCreateChurchNotice() {
  const queryClient = useQueryClient()
  const createChurchNotice = new CreateChurchNotice(noticeRepository)

  return useMutation({
    mutationFn: async (input: CreateChurchNoticeInput) => {
      const result = await createChurchNotice.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (_, variables) => {
      // 해당 교회의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.byChurchId(variables.churchId) })
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.active(variables.churchId) })
    },
  })
}

/**
 * 공지사항 수정 뮤테이션 훅
 */
export function useUpdateChurchNotice(churchId: string) {
  const queryClient = useQueryClient()
  const updateChurchNotice = new UpdateChurchNotice(noticeRepository)

  return useMutation({
    mutationFn: async (input: UpdateChurchNoticeInput) => {
      const result = await updateChurchNotice.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 교회의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.byChurchId(churchId) })
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.active(churchId) })
    },
  })
}

/**
 * 공지사항 삭제 뮤테이션 훅
 */
export function useDeleteChurchNotice(churchId: string) {
  const queryClient = useQueryClient()
  const deleteChurchNotice = new DeleteChurchNotice(noticeRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteChurchNotice.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 교회의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.byChurchId(churchId) })
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.active(churchId) })
    },
  })
}

/**
 * 공지사항 고정 토글 뮤테이션 훅
 */
export function useToggleNoticePin(churchId: string) {
  const queryClient = useQueryClient()
  const toggleNoticePin = new ToggleNoticePin(noticeRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleNoticePin.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 교회의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.byChurchId(churchId) })
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.active(churchId) })
    },
  })
}

/**
 * 공지사항 활성화 토글 뮤테이션 훅
 */
export function useToggleNoticeActive(churchId: string) {
  const queryClient = useQueryClient()
  const toggleNoticeActive = new ToggleNoticeActive(noticeRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await toggleNoticeActive.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 해당 교회의 공지사항 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.byChurchId(churchId) })
      queryClient.invalidateQueries({ queryKey: churchNoticeKeys.active(churchId) })
    },
  })
}

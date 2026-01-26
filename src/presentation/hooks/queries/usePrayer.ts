'use client'

/**
 * Prayer React Query Hooks
 *
 * 기도제목 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetPrayers } from '@/application/use-cases/prayer/GetPrayers'
import { CreatePrayer } from '@/application/use-cases/prayer/CreatePrayer'
import { DeletePrayer } from '@/application/use-cases/prayer/DeletePrayer'
import { MarkPrayerAsAnswered } from '@/application/use-cases/prayer/MarkPrayerAsAnswered'
import { TogglePrayerSupport } from '@/application/use-cases/prayer/TogglePrayerSupport'
import { SupabasePrayerRepository } from '@/infrastructure/repositories/SupabasePrayerRepository'
import { CreatePrayerInput } from '@/domain/entities/Prayer'

// Query Key Factory
export const prayerKeys = {
  all: ['prayer'] as const,
  byGroupId: (groupId: string) => [...prayerKeys.all, 'group', groupId] as const,
}

// Repository 인스턴스 (싱글톤)
const prayerRepository = new SupabasePrayerRepository()

/**
 * 그룹 기도제목 목록 조회 훅
 */
export function usePrayers(
  groupId: string | null,
  options?: {
    userId?: string | null
    enabled?: boolean
  }
) {
  const getPrayers = new GetPrayers(prayerRepository)

  return useQuery({
    queryKey: prayerKeys.byGroupId(groupId ?? ''),
    queryFn: async () => {
      if (!groupId) return { prayers: [], error: null }

      const result = await getPrayers.execute({
        groupId,
        userId: options?.userId,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!groupId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 기도제목 생성 뮤테이션 훅
 */
export function useCreatePrayer(groupId: string) {
  const queryClient = useQueryClient()
  const createPrayer = new CreatePrayer(prayerRepository)

  return useMutation({
    mutationFn: async (input: Omit<CreatePrayerInput, 'groupId'>) => {
      const result = await createPrayer.execute({ ...input, groupId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerKeys.byGroupId(groupId) })
    },
  })
}

/**
 * 기도제목 삭제 뮤테이션 훅
 */
export function useDeletePrayer(groupId: string) {
  const queryClient = useQueryClient()
  const deletePrayer = new DeletePrayer(prayerRepository)

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await deletePrayer.execute({ id, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerKeys.byGroupId(groupId) })
    },
  })
}

/**
 * 기도제목 응답됨 표시 뮤테이션 훅
 */
export function useMarkPrayerAsAnswered(groupId: string) {
  const queryClient = useQueryClient()
  const markPrayerAsAnswered = new MarkPrayerAsAnswered(prayerRepository)

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await markPrayerAsAnswered.execute({ id, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerKeys.byGroupId(groupId) })
    },
  })
}

/**
 * 함께 기도 토글 뮤테이션 훅
 */
export function useTogglePrayerSupport(groupId: string) {
  const queryClient = useQueryClient()
  const togglePrayerSupport = new TogglePrayerSupport(prayerRepository)

  return useMutation({
    mutationFn: async ({ prayerId, userId }: { prayerId: string; userId: string }) => {
      const result = await togglePrayerSupport.execute({ prayerId, userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prayerKeys.byGroupId(groupId) })
    },
  })
}

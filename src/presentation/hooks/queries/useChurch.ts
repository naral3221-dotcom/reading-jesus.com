'use client'

/**
 * Church React Query Hooks
 *
 * 교회 데이터 조회를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetChurch } from '@/application/use-cases/church/GetChurch'
import { SearchChurches } from '@/application/use-cases/church/SearchChurches'
import { JoinChurch, JoinChurchInput } from '@/application/use-cases/church/JoinChurch'
import { LeaveChurch, LeaveChurchInput } from '@/application/use-cases/church/LeaveChurch'
import {
  GetChurchMembers,
  GetChurchMembersInput,
} from '@/application/use-cases/church/GetChurchMembers'
import {
  RegisterChurch,
  RegisterChurchInput,
} from '@/application/use-cases/church/RegisterChurch'
import { SupabaseChurchRepository } from '@/infrastructure/repositories/SupabaseChurchRepository'
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository'
import { SupabaseChurchAdminRepository } from '@/infrastructure/repositories/SupabaseChurchAdminRepository'

// Query Key Factory
export const churchKeys = {
  all: ['church'] as const,
  byId: (id: string) => [...churchKeys.all, 'id', id] as const,
  byCode: (code: string) => [...churchKeys.all, 'code', code] as const,
  search: (query: string) => [...churchKeys.all, 'search', query] as const,
  members: (churchId: string) => [...churchKeys.all, 'members', churchId] as const,
  popular: () => [...churchKeys.all, 'popular'] as const,
}

// Repository 인스턴스 (싱글톤)
const churchRepository = new SupabaseChurchRepository()
const userRepository = new SupabaseUserRepository()
const churchAdminRepository = new SupabaseChurchAdminRepository()

/**
 * 교회 ID로 조회하는 훅
 */
export function useChurchById(id: string | null) {
  const getChurch = new GetChurch(churchRepository)

  return useQuery({
    queryKey: churchKeys.byId(id ?? ''),
    queryFn: async () => {
      if (!id) return null
      const result = await getChurch.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 교회 코드로 조회하는 훅
 */
export function useChurchByCode(code: string | null) {
  const getChurch = new GetChurch(churchRepository)

  return useQuery({
    queryKey: churchKeys.byCode(code ?? ''),
    queryFn: async () => {
      if (!code) return null
      const result = await getChurch.execute({ code })
      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 교회 검색 훅
 */
export function useSearchChurches(query: string, options?: { enabled?: boolean }) {
  const searchChurches = new SearchChurches(churchRepository)

  return useQuery({
    queryKey: churchKeys.search(query),
    queryFn: async () => {
      const result = await searchChurches.execute({ query })
      if (result.error) throw new Error(result.error)
      return result.churches
    },
    enabled: options?.enabled !== false && query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 교회 가입 뮤테이션 훅
 */
export function useJoinChurch() {
  const queryClient = useQueryClient()
  const joinChurch = new JoinChurch(userRepository, churchRepository)

  return useMutation({
    mutationFn: async (input: JoinChurchInput) => {
      const result = await joinChurch.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (data) => {
      // 교회 데이터 캐시 무효화
      if (data.church) {
        queryClient.invalidateQueries({ queryKey: churchKeys.byId(data.church.id) })
        queryClient.invalidateQueries({ queryKey: churchKeys.byCode(data.church.code) })
        queryClient.invalidateQueries({ queryKey: churchKeys.members(data.church.id) })
      }
      // 사용자 데이터 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] })
    },
  })
}

/**
 * 교회 탈퇴 뮤테이션 훅
 */
export function useLeaveChurch() {
  const queryClient = useQueryClient()
  const leaveChurch = new LeaveChurch(churchRepository)

  return useMutation({
    mutationFn: async (input: LeaveChurchInput) => {
      const result = await leaveChurch.execute(input)
      if (!result.success) {
        throw new Error(result.error || '교회 탈퇴에 실패했습니다.')
      }
      return result
    },
    onSuccess: (_, variables) => {
      // 교회 멤버 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: churchKeys.members(variables.churchId),
      })
      // 사용자 데이터 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] })
    },
  })
}

/**
 * 교회 멤버 목록 조회 훅
 */
export function useChurchMembers(
  churchId: string | null,
  options?: { limit?: number; offset?: number; enabled?: boolean }
) {
  const getChurchMembers = new GetChurchMembers(churchRepository)

  return useQuery({
    queryKey: churchKeys.members(churchId ?? ''),
    queryFn: async () => {
      if (!churchId) return { members: [], totalCount: 0, error: null }

      const input: GetChurchMembersInput = {
        churchId,
        limit: options?.limit,
        offset: options?.offset,
      }

      const result = await getChurchMembers.execute(input)
      if (result.error) {
        throw new Error(result.error)
      }
      return result
    },
    enabled: options?.enabled !== false && !!churchId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 인기/추천 교회 목록 조회 훅
 */
export function usePopularChurches() {
  return useQuery({
    queryKey: churchKeys.popular(),
    queryFn: async () => {
      const result = await churchRepository.findPopular(10)
      return result
    },
    staleTime: 1000 * 60 * 30, // 30분 캐시
  })
}

/**
 * 교회 등록 뮤테이션 훅
 */
export function useRegisterChurch() {
  const queryClient = useQueryClient()
  const registerChurch = new RegisterChurch(churchRepository, churchAdminRepository)

  return useMutation({
    mutationFn: async (input: RegisterChurchInput) => {
      const result = await registerChurch.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 교회 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: churchKeys.all })
      queryClient.invalidateQueries({ queryKey: churchKeys.popular() })
    },
  })
}

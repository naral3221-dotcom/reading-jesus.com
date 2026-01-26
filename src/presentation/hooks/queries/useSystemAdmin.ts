'use client'

/**
 * SystemAdmin React Query Hooks
 *
 * 시스템 관리자용 React Query 훅.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseSystemAdminRepository } from '@/infrastructure/repositories/SupabaseSystemAdminRepository'
import {
  GetSystemStats,
  GetAllChurches,
  CreateChurch,
  DeleteChurch,
  GetAllGroups,
  GetAllUsers,
  GetRegionCodes,
} from '@/application/use-cases/system-admin'
import type { CreateChurchInput, AdminSearchParams } from '@/domain/entities/SystemAdmin'

// Repository 인스턴스 (싱글톤)
const adminRepository = new SupabaseSystemAdminRepository()

// Use Case 인스턴스
const getSystemStats = new GetSystemStats(adminRepository)
const getAllChurches = new GetAllChurches(adminRepository)
const createChurch = new CreateChurch(adminRepository)
const deleteChurch = new DeleteChurch(adminRepository)
const getAllGroups = new GetAllGroups(adminRepository)
const getAllUsers = new GetAllUsers(adminRepository)
const getRegionCodes = new GetRegionCodes(adminRepository)

// Query Keys
export const systemAdminKeys = {
  all: ['systemAdmin'] as const,
  stats: () => [...systemAdminKeys.all, 'stats'] as const,
  churches: () => [...systemAdminKeys.all, 'churches'] as const,
  churchList: (params: AdminSearchParams) => [...systemAdminKeys.churches(), params] as const,
  groups: () => [...systemAdminKeys.all, 'groups'] as const,
  groupList: (params: AdminSearchParams) => [...systemAdminKeys.groups(), params] as const,
  users: () => [...systemAdminKeys.all, 'users'] as const,
  userList: (params: AdminSearchParams) => [...systemAdminKeys.users(), params] as const,
  regionCodes: () => [...systemAdminKeys.all, 'regionCodes'] as const,
}

/**
 * 시스템 통계 조회
 */
export function useSystemStats() {
  return useQuery({
    queryKey: systemAdminKeys.stats(),
    queryFn: async () => {
      const result = await getSystemStats.execute()
      if (result.error) throw new Error(result.error)
      return result.stats
    },
  })
}

/**
 * 교회 목록 조회 (페이지네이션)
 */
export function useAdminChurches(params: AdminSearchParams) {
  return useQuery({
    queryKey: systemAdminKeys.churchList(params),
    queryFn: async () => {
      const result = await getAllChurches.execute(params)
      if (result.error) throw new Error(result.error)
      return result.result
    },
  })
}

/**
 * 교회 생성
 */
export function useCreateChurch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateChurchInput) => {
      const result = await createChurch.execute(input)
      if (result.error) throw new Error(result.error)
      return result.church
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.churches() })
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.stats() })
    },
  })
}

/**
 * 교회 삭제
 */
export function useDeleteChurch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteChurch.execute(id)
      if (!result.success) throw new Error(result.error ?? '삭제 실패')
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.churches() })
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.stats() })
    },
  })
}

/**
 * 교회 활성화/비활성화 토글
 */
export function useToggleChurchActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const isActive = await adminRepository.toggleChurchActive(id)
      return { id, isActive }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.churches() })
    },
  })
}

/**
 * 교회 토큰 재생성
 */
export function useRegenerateChurchToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tokenType }: { id: string; tokenType: 'admin' | 'write' }) => {
      const newToken = await adminRepository.regenerateChurchToken(id, tokenType)
      return { id, tokenType, newToken }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.churches() })
    },
  })
}

/**
 * 지역 코드 목록 조회
 */
export function useRegionCodes() {
  return useQuery({
    queryKey: systemAdminKeys.regionCodes(),
    queryFn: async () => {
      const result = await getRegionCodes.execute()
      if (result.error) throw new Error(result.error)
      return result.regions
    },
    staleTime: 1000 * 60 * 60, // 1시간 캐시
  })
}

/**
 * 그룹 목록 조회 (페이지네이션)
 */
export function useAdminGroups(params: AdminSearchParams) {
  return useQuery({
    queryKey: systemAdminKeys.groupList(params),
    queryFn: async () => {
      const result = await getAllGroups.execute(params)
      if (result.error) throw new Error(result.error)
      return result.result
    },
  })
}

/**
 * 그룹 삭제
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.deleteGroup(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.groups() })
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.stats() })
    },
  })
}

/**
 * 그룹 활성화/비활성화 토글
 */
export function useToggleGroupActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const isActive = await adminRepository.toggleGroupActive(id)
      return { id, isActive }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.groups() })
    },
  })
}

/**
 * 사용자 목록 조회 (페이지네이션)
 */
export function useAdminUsers(params: AdminSearchParams) {
  return useQuery({
    queryKey: systemAdminKeys.userList(params),
    queryFn: async () => {
      const result = await getAllUsers.execute(params)
      if (result.error) throw new Error(result.error)
      return result.result
    },
  })
}

/**
 * 사용자 삭제
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await adminRepository.deleteUser(id)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.users() })
      queryClient.invalidateQueries({ queryKey: systemAdminKeys.stats() })
    },
  })
}

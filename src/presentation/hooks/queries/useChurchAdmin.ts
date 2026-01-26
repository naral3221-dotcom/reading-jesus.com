'use client'

/**
 * ChurchAdmin React Query Hooks
 *
 * 교회 관리자 관련 React Query 훅.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseChurchAdminRepository } from '@/infrastructure/repositories/SupabaseChurchAdminRepository'
import {
  AuthenticateChurchAdmin,
  AuthenticateWithToken,
  GetChurchAdmins,
  CreateChurchAdmin,
  DeleteChurchAdmin,
  ToggleAdminActive,
  SendPasswordResetEmail,
  GetChurchByCode,
  CheckAdminSession,
} from '@/application/use-cases/church-admin'
import type { CreateChurchAdminInput } from '@/domain/entities/ChurchAdmin'

// Repository 인스턴스 (싱글톤)
const adminRepository = new SupabaseChurchAdminRepository()

// Use Case 인스턴스
const authenticateChurchAdmin = new AuthenticateChurchAdmin(adminRepository)
const authenticateWithToken = new AuthenticateWithToken(adminRepository)
const getChurchAdmins = new GetChurchAdmins(adminRepository)
const createChurchAdmin = new CreateChurchAdmin(adminRepository)
const deleteChurchAdmin = new DeleteChurchAdmin(adminRepository)
const toggleAdminActive = new ToggleAdminActive(adminRepository)
const sendPasswordResetEmail = new SendPasswordResetEmail(adminRepository)
const getChurchByCode = new GetChurchByCode(adminRepository)
const checkAdminSession = new CheckAdminSession(adminRepository)

// Query Keys
export const churchAdminKeys = {
  all: ['churchAdmin'] as const,
  lists: () => [...churchAdminKeys.all, 'list'] as const,
  list: (churchId: string) => [...churchAdminKeys.lists(), churchId] as const,
  church: (code: string) => [...churchAdminKeys.all, 'church', code] as const,
  session: (userId: string, churchId: string) =>
    [...churchAdminKeys.all, 'session', userId, churchId] as const,
}

/**
 * 교회 코드로 교회 정보 조회
 */
export function useChurchByCodeForAdmin(code: string | null) {
  return useQuery({
    queryKey: churchAdminKeys.church(code ?? ''),
    queryFn: async () => {
      if (!code) return null
      const result = await getChurchByCode.execute(code)
      if (result.error) throw new Error(result.error)
      return result.church
    },
    enabled: !!code,
  })
}

/**
 * 교회별 관리자 목록 조회
 */
export function useChurchAdmins(churchId: string | null) {
  return useQuery({
    queryKey: churchAdminKeys.list(churchId ?? ''),
    queryFn: async () => {
      if (!churchId) return []
      const result = await getChurchAdmins.execute(churchId)
      if (result.error) throw new Error(result.error)
      return result.admins
    },
    enabled: !!churchId,
  })
}

/**
 * 현재 사용자가 교회 관리자인지 확인
 */
export function useIsChurchAdmin(userId: string | null, churchId: string | null) {
  return useQuery({
    queryKey: churchAdminKeys.session(userId ?? '', churchId ?? ''),
    queryFn: async () => {
      if (!userId || !churchId) return false
      const result = await checkAdminSession.execute(userId, churchId)
      return result.isAdmin
    },
    enabled: !!userId && !!churchId,
  })
}

/**
 * 이메일/비밀번호 로그인
 */
export function useChurchAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      password,
      churchCode,
    }: {
      email: string
      password: string
      churchCode: string
    }) => {
      const result = await authenticateChurchAdmin.execute({ email, password, churchCode })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchAdminKeys.all })
    },
  })
}

/**
 * 토큰 로그인
 */
export function useChurchAdminTokenLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ token, churchCode }: { token: string; churchCode: string }) => {
      const result = await authenticateWithToken.execute({ token, churchCode })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchAdminKeys.all })
    },
  })
}

/**
 * 교회 관리자 생성
 */
export function useCreateChurchAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateChurchAdminInput) => {
      const result = await createChurchAdmin.execute(input)
      if (result.error) throw new Error(result.error)
      return result.admin
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: churchAdminKeys.list(variables.churchId),
      })
    },
  })
}

/**
 * 교회 관리자 삭제
 */
export function useDeleteChurchAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, churchId }: { id: string; churchId: string }) => {
      const result = await deleteChurchAdmin.execute(id)
      if (!result.success) throw new Error(result.error ?? '삭제 실패')
      return { id, churchId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: churchAdminKeys.list(data.churchId),
      })
    },
  })
}

/**
 * 관리자 활성화/비활성화 토글
 */
export function useToggleChurchAdminActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, churchId }: { id: string; churchId: string }) => {
      const result = await toggleAdminActive.execute(id)
      if (result.error) throw new Error(result.error)
      return { isActive: result.isActive, churchId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: churchAdminKeys.list(data.churchId),
      })
    },
  })
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export function useSendPasswordResetEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await sendPasswordResetEmail.execute(email)
      if (!result.success) throw new Error(result.error ?? '발송 실패')
      return true
    },
  })
}

/**
 * 로그아웃
 */
export function useChurchAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await adminRepository.signOut()
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: churchAdminKeys.all })
    },
  })
}

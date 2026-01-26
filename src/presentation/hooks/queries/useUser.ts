'use client'

/**
 * User React Query Hooks
 *
 * 사용자 데이터 조회를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetCurrentUser } from '@/application/use-cases/user/GetCurrentUser'
import { UpdateProfile, UpdateProfileInput } from '@/application/use-cases/user/UpdateProfile'
import { UploadAvatar } from '@/application/use-cases/user/UploadAvatar'
import { DeleteAvatar } from '@/application/use-cases/user/DeleteAvatar'
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository'
import { SupabaseChurchRepository } from '@/infrastructure/repositories/SupabaseChurchRepository'
import { useAuthInitialized } from '@/presentation/providers/QueryProvider'

// Query Key Factory
export const userKeys = {
  all: ['user'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  byId: (id: string) => [...userKeys.all, 'id', id] as const,
}

// Repository 인스턴스 (싱글톤) - mutation용
const userRepository = new SupabaseUserRepository()

// Use Case 인스턴스
const uploadAvatar = new UploadAvatar(userRepository)
const deleteAvatar = new DeleteAvatar(userRepository)

/**
 * 현재 로그인한 사용자 조회 훅
 *
 * 세션 초기화가 완료된 후에만 쿼리를 실행합니다.
 * authInitialized가 false일 때도 isLoading을 true로 반환하여
 * 컴포넌트에서 로딩 상태를 올바르게 처리할 수 있도록 합니다.
 */
export function useCurrentUser() {
  const authInitialized = useAuthInitialized()

  const query = useQuery({
    queryKey: userKeys.current(),
    queryFn: async () => {
      const getCurrentUser = new GetCurrentUser(
        new SupabaseUserRepository(),
        new SupabaseChurchRepository()
      )
      const result = await getCurrentUser.execute()
      // error가 있어도 user: null인 경우는 정상 (로그인 안 됨)
      // 실제 에러만 throw
      if (result.error && result.user === null) {
        // 로그인 안 된 상태는 에러가 아님
        return result
      }
      if (result.error) throw new Error(result.error)
      return result
    },
    staleTime: 1000 * 60 * 5, // 5분
    retry: 1, // 재시도 횟수 제한
    enabled: authInitialized, // 세션 초기화 완료 후에만 쿼리 실행
  })

  // authInitialized가 false일 때는 isLoading을 true로 오버라이드
  return {
    ...query,
    isLoading: !authInitialized || query.isLoading,
  }
}

/**
 * 프로필 업데이트 뮤테이션 훅
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const updateProfile = new UpdateProfile(userRepository)

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const result = await updateProfile.execute(input)
      if (result.error) throw new Error(result.error)
      return result.user
    },
    onSuccess: () => {
      // 사용자 데이터 캐시 무효화
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
    },
  })
}

/**
 * 아바타 업로드 뮤테이션 훅
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      file,
      existingAvatarUrl,
    }: {
      userId: string
      file: File
      existingAvatarUrl?: string | null
    }) => {
      const result = await uploadAvatar.execute({ userId, file, existingAvatarUrl })
      if (result.error) throw new Error(result.error)
      return result.avatarUrl
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
    },
  })
}

/**
 * 아바타 삭제 뮤테이션 훅
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, avatarUrl }: { userId: string; avatarUrl: string }) => {
      const result = await deleteAvatar.execute({ userId, avatarUrl })
      if (!result.success) throw new Error(result.error ?? '삭제 실패')
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() })
    },
  })
}

/**
 * 계정 삭제 뮤테이션 훅
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const supabase = (await import('@/infrastructure/supabase/client')).getSupabaseBrowserClient()

      // 그룹 멤버십 삭제
      await supabase.from('group_members').delete().eq('user_id', userId)

      // 댓글 삭제
      await supabase.from('comments').delete().eq('user_id', userId)

      // 읽기 체크 삭제
      await supabase.from('daily_checks').delete().eq('user_id', userId)

      // 프로필 삭제
      const { error } = await supabase.from('profiles').delete().eq('id', userId)

      if (error) throw new Error('계정 삭제 실패')

      return true
    },
    onSuccess: () => {
      queryClient.clear() // 모든 캐시 클리어
    },
  })
}

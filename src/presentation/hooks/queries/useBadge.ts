'use client'

/**
 * Badge React Query Hooks
 *
 * 사용자 배지 관련 React Query 훅.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { UserBadgeWithDefinition } from '@/types'

// Query Keys
export const badgeKeys = {
  all: ['badge'] as const,
  byUser: (userId: string, groupId?: string) =>
    [...badgeKeys.all, 'user', userId, groupId ?? 'all'] as const,
  unnotified: (userId: string) => [...badgeKeys.all, 'unnotified', userId] as const,
}

interface BadgeRow {
  id: string
  user_id: string
  badge_id: string
  group_id: string | null
  earned_at: string
  badge:
    | {
        id: string
        name: string
        description: string
        icon: string
        category: string
        requirement_type: string
        requirement_value: number
      }
    | Array<{
        id: string
        name: string
        description: string
        icon: string
        category: string
        requirement_type: string
        requirement_value: number
      }>
}

/**
 * 사용자 배지 목록 조회 훅
 */
export function useUserBadges(
  userId: string | null,
  groupId?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: badgeKeys.byUser(userId ?? '', groupId),
    queryFn: async (): Promise<UserBadgeWithDefinition[]> => {
      if (!userId) return []

      const supabase = getSupabaseBrowserClient()

      let query = supabase
        .from('user_badges')
        .select(
          `
          *,
          badge:badge_id (*)
        `
        )
        .eq('user_id', userId)

      if (groupId) {
        query = query.or(`group_id.eq.${groupId},group_id.is.null`)
      }

      const { data, error } = await query.order('earned_at', { ascending: false })

      if (error) {
        console.error('배지 로드 에러:', error)
        return []
      }

      // Supabase 조인 결과가 배열로 올 수 있으므로 처리
      return (data as BadgeRow[]).map((item) => ({
        ...item,
        badge: Array.isArray(item.badge) ? item.badge[0] : item.badge,
      })) as UserBadgeWithDefinition[]
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 알림되지 않은 새 배지 조회 훅
 */
export function useUnnotifiedBadges(userId: string | null) {
  return useQuery({
    queryKey: badgeKeys.unnotified(userId ?? ''),
    queryFn: async (): Promise<UserBadgeWithDefinition[]> => {
      if (!userId) return []

      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('user_badges')
        .select(
          `
          *,
          badge:badge_id (*)
        `
        )
        .eq('user_id', userId)
        .eq('is_notified', false)
        .order('earned_at', { ascending: true })

      if (error) {
        console.error('새 배지 확인 에러:', error)
        return []
      }

      // Supabase 조인 결과가 배열로 올 수 있으므로 처리
      return (data as BadgeRow[]).map((item) => ({
        ...item,
        badge: Array.isArray(item.badge) ? item.badge[0] : item.badge,
      })) as UserBadgeWithDefinition[]
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 배지 알림 처리 완료 뮤테이션 훅
 */
export function useMarkBadgeAsNotified() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ badgeId, userId }: { badgeId: string; userId: string }) => {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from('user_badges')
        .update({ is_notified: true })
        .eq('id', badgeId)

      if (error) throw error
      return { userId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: badgeKeys.unnotified(data.userId),
      })
    },
  })
}

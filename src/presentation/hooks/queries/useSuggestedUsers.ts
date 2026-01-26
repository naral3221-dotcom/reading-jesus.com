'use client'

/**
 * useSuggestedUsers - 추천 사용자 조회 훅
 *
 * 같은 교회 사용자를 우선으로, 이미 팔로우 중인 사용자는 제외하여 추천합니다.
 */

import { useQuery } from '@tanstack/react-query'
import { SupabaseUserFollowRepository } from '@/infrastructure/repositories/SupabaseUserFollowRepository'
import type { UserWithFollowStatus } from '@/domain/entities/UserFollow'

const repository = new SupabaseUserFollowRepository()

export function useSuggestedUsers(
  userId: string | null,
  churchId?: string | null,
  limit: number = 5
) {
  return useQuery<UserWithFollowStatus[]>({
    queryKey: ['suggestedUsers', userId, churchId, limit],
    queryFn: async () => {
      if (!userId) return []
      return repository.getSuggestedUsers({
        currentUserId: userId,
        churchId,
        limit,
      })
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
  })
}

'use client'

/**
 * Unified Feed React Query Hooks
 *
 * 통합 피드 조회를 위한 React Query 훅들.
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { GetUnifiedFeed, type UnifiedFeedTab } from '@/application/use-cases/unified-feed'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { useAuthInitialized } from '@/presentation/providers/QueryProvider'
import { useCurrentUser } from './useUser'
import { useUserGroups } from './useGroup'

// Query Key Factory
export const unifiedFeedKeys = {
  all: ['unified-feed'] as const,
  list: (tab: UnifiedFeedTab) => [...unifiedFeedKeys.all, 'list', tab] as const,
  infinite: (tab: UnifiedFeedTab) => [...unifiedFeedKeys.all, 'infinite', tab] as const,
}

const ITEMS_PER_PAGE = 20

interface UseUnifiedFeedOptions {
  tab: UnifiedFeedTab
  enabled?: boolean
}

/**
 * 통합 피드 조회 훅 (일반 페이지네이션)
 */
export function useUnifiedFeed({ tab, enabled = true }: UseUnifiedFeedOptions) {
  const authInitialized = useAuthInitialized()
  const { data: userData } = useCurrentUser()
  const { data: userGroups } = useUserGroups(userData?.user?.id ?? null)

  const user = userData?.user
  // userGroups는 GroupWithMemberCount[] 형태: { group: Group, memberCount: number }[]
  const groupIds = userGroups?.map(g => g.group.id) || []
  const churchId = user?.churchId ?? null

  // 팔로잉 ID는 별도로 조회해야 함 (현재는 빈 배열로 시작)
  const followingUserIds: string[] = []

  return useQuery({
    queryKey: unifiedFeedKeys.list(tab),
    queryFn: async () => {
      const getUnifiedFeed = new GetUnifiedFeed(() => getSupabaseBrowserClient())
      return getUnifiedFeed.execute({
        tab,
        currentUserId: user?.id,
        limit: ITEMS_PER_PAGE,
        offset: 0,
        groupIds,
        churchId,
        followingUserIds,
      })
    },
    staleTime: 1000 * 60, // 1분
    enabled: authInitialized && enabled,
  })
}

/**
 * 통합 피드 무한 스크롤 조회 훅
 */
export function useUnifiedFeedInfinite({ tab, enabled = true }: UseUnifiedFeedOptions) {
  const authInitialized = useAuthInitialized()
  const { data: userData } = useCurrentUser()
  const { data: userGroups } = useUserGroups(userData?.user?.id ?? null)

  const user = userData?.user
  // userGroups는 GroupWithMemberCount[] 형태: { group: Group, memberCount: number }[]
  const groupIds = userGroups?.map(g => g.group.id) || []
  const churchId = user?.churchId ?? null

  // 팔로잉 ID는 별도로 조회해야 함
  const followingUserIds: string[] = []

  return useInfiniteQuery({
    queryKey: unifiedFeedKeys.infinite(tab),
    queryFn: async ({ pageParam = 0 }) => {
      const getUnifiedFeed = new GetUnifiedFeed(() => getSupabaseBrowserClient())
      return getUnifiedFeed.execute({
        tab,
        currentUserId: user?.id,
        limit: ITEMS_PER_PAGE,
        offset: pageParam,
        groupIds,
        churchId,
        followingUserIds,
      })
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined
      return allPages.length * ITEMS_PER_PAGE
    },
    staleTime: 1000 * 60, // 1분
    enabled: authInitialized && enabled,
  })
}

/**
 * 팔로잉 사용자 ID 목록 조회 훅
 */
export function useFollowingUserIds(userId?: string) {
  const authInitialized = useAuthInitialized()

  return useQuery({
    queryKey: ['following-ids', userId],
    queryFn: async () => {
      if (!userId) return []

      const supabase = getSupabaseBrowserClient()
      const { data } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)

      return data?.map(d => d.following_id) || []
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: authInitialized && !!userId,
  })
}

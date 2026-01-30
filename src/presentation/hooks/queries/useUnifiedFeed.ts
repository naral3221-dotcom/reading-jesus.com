'use client'

/**
 * Unified Feed React Query Hooks
 *
 * 통합 피드 조회를 위한 React Query 훅들.
 * 커서 기반 무한 스크롤 지원
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { GetUnifiedFeed, type UnifiedFeedTab, type FeedContentTypeFilter } from '@/application/use-cases/unified-feed'
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
  typeFilter?: FeedContentTypeFilter
  enabled?: boolean
}

/**
 * 통합 피드 조회 훅 (일반 조회 - 첫 페이지만)
 */
export function useUnifiedFeed({ tab, typeFilter = 'all', enabled = true }: UseUnifiedFeedOptions) {
  const authInitialized = useAuthInitialized()
  const { data: userData } = useCurrentUser()
  const { data: userGroups } = useUserGroups(userData?.user?.id ?? null)

  const user = userData?.user
  const groupIds = userGroups?.map(g => g.group.id) || []
  const churchId = user?.churchId ?? null
  const followingUserIds: string[] = []

  return useQuery({
    queryKey: [...unifiedFeedKeys.list(tab), typeFilter],
    queryFn: async () => {
      const getUnifiedFeed = new GetUnifiedFeed(() => getSupabaseBrowserClient())
      return getUnifiedFeed.execute({
        tab,
        typeFilter,
        currentUserId: user?.id,
        limit: ITEMS_PER_PAGE,
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
 * 통합 피드 무한 스크롤 조회 훅 (커서 기반)
 */
export function useUnifiedFeedInfinite({ tab, typeFilter = 'all', enabled = true }: UseUnifiedFeedOptions) {
  const authInitialized = useAuthInitialized()
  const { data: userData } = useCurrentUser()
  const { data: userGroups } = useUserGroups(userData?.user?.id ?? null)

  const user = userData?.user
  const groupIds = userGroups?.map(g => g.group.id) || []
  const churchId = user?.churchId ?? null
  const followingUserIds: string[] = []

  return useInfiniteQuery({
    queryKey: [...unifiedFeedKeys.infinite(tab), typeFilter],
    queryFn: async ({ pageParam }) => {
      console.log('[useUnifiedFeedInfinite] 쿼리 시작:', {
        tab,
        typeFilter,
        currentUserId: user?.id,
        pageParam,
        groupIds,
        churchId,
        followingUserIds,
      })

      const getUnifiedFeed = new GetUnifiedFeed(() => getSupabaseBrowserClient())
      const result = await getUnifiedFeed.execute({
        tab,
        typeFilter,
        currentUserId: user?.id,
        limit: ITEMS_PER_PAGE,
        cursor: pageParam, // 커서 기반
        groupIds,
        churchId,
        followingUserIds,
      })

      console.log('[useUnifiedFeedInfinite] 쿼리 결과:', {
        itemsCount: result.items.length,
        hasMore: result.hasMore,
        error: result.error,
      })

      return result
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined
      return lastPage.nextCursor // 다음 페이지 커서
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

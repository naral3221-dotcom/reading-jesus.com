'use client'

/**
 * Public Feed React Query Hooks
 *
 * 전체 공개 피드 조회를 위한 React Query 훅들
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { GetPublicFeed } from '@/application/use-cases/public-feed/GetPublicFeed'
import { GetPopularChurches } from '@/application/use-cases/public-feed/GetPopularChurches'
import { ToggleFeedLike } from '@/application/use-cases/public-feed/ToggleFeedLike'
import type { PublicFeedFilters, PublicFeedItem } from '@/types'

// Query Key Factory
export const publicFeedKeys = {
  all: ['publicFeed'] as const,
  list: (filters: PublicFeedFilters) => [...publicFeedKeys.all, 'list', filters] as const,
  popularChurches: (limit: number) => [...publicFeedKeys.all, 'popularChurches', limit] as const,
}

// Use Case 인스턴스
const getPublicFeed = new GetPublicFeed()
const getPopularChurches = new GetPopularChurches()
const toggleFeedLike = new ToggleFeedLike()

/**
 * 공개 피드 무한 스크롤 훅
 */
export function usePublicFeedInfinite(filters: PublicFeedFilters = {}, pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: publicFeedKeys.list(filters),
    queryFn: async ({ pageParam }) => {
      return getPublicFeed.execute({
        filters,
        cursor: pageParam,
        limit: pageSize,
      })
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 인기 교회 목록 훅
 */
export function usePopularChurches(limit: number = 10) {
  return useQuery({
    queryKey: publicFeedKeys.popularChurches(limit),
    queryFn: () => getPopularChurches.execute(limit),
    staleTime: 1000 * 60 * 10, // 10분
  })
}

/**
 * 피드 좋아요 토글 mutation
 */
export function useToggleFeedLike() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      userId,
      deviceId,
    }: {
      itemId: string
      itemType: 'meditation' | 'qt'
      userId?: string
      deviceId?: string
    }) => {
      return toggleFeedLike.execute({ itemId, itemType, userId, deviceId })
    },
    onMutate: async ({ itemId }) => {
      // 낙관적 업데이트를 위해 현재 캐시 스냅샷 저장
      const previousData = queryClient.getQueriesData({ queryKey: publicFeedKeys.all })

      // 모든 피드 쿼리에서 해당 아이템 찾아서 업데이트
      queryClient.setQueriesData(
        { queryKey: publicFeedKeys.all },
        (oldData: { pages?: { items: PublicFeedItem[]; nextCursor: string | null; hasMore: boolean }[] } | undefined) => {
          if (!oldData?.pages) return oldData

          return {
            ...oldData,
            pages: oldData.pages.map((page) => ({
              ...page,
              items: page.items.map((item: PublicFeedItem) =>
                item.id === itemId
                  ? { ...item, likesCount: item.likesCount + 1 }
                  : item
              ),
            })),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // 에러 시 이전 데이터로 롤백
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
  })
}

/**
 * 디바이스 ID 가져오기 (없으면 생성)
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return ''

  let deviceId = localStorage.getItem('device_id')
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem('device_id', deviceId)
  }
  return deviceId
}

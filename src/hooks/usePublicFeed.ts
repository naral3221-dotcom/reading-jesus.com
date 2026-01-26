'use client';

/**
 * Legacy Public Feed Hooks
 *
 * 호환성을 위해 유지되는 레거시 훅.
 * 새 코드에서는 @/presentation/hooks/queries/usePublicFeed 사용 권장.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  usePublicFeedInfinite,
  usePopularChurches as usePopularChurchesQuery,
  useToggleFeedLike,
  getOrCreateDeviceId,
} from '@/presentation/hooks/queries/usePublicFeed';
import type { PublicFeedFilters } from '@/types';

interface UsePublicFeedOptions {
  initialFilters?: PublicFeedFilters;
  pageSize?: number;
}

/**
 * @deprecated 새 코드에서는 usePublicFeedInfinite 사용 권장
 */
export function usePublicFeed(options: UsePublicFeedOptions = {}) {
  const { initialFilters = {}, pageSize = 20 } = options;
  const [filters, setFilters] = useState<PublicFeedFilters>(initialFilters);

  const {
    data,
    isLoading,
    isFetchingNextPage: isLoadingMore,
    hasNextPage: hasMore,
    error: queryError,
    fetchNextPage,
    refetch,
  } = usePublicFeedInfinite(filters, pageSize);

  const toggleLike = useToggleFeedLike();

  // 모든 페이지의 아이템을 평탄화
  const items = useMemo(() => {
    return data?.pages.flatMap(page => page.items) ?? [];
  }, [data]);

  const loadMore = useCallback(async () => {
    if (hasMore) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasMore]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleLike = useCallback(async (itemId: string, itemType: 'meditation' | 'qt') => {
    const deviceId = getOrCreateDeviceId();
    await toggleLike.mutateAsync({ itemId, itemType, deviceId });
  }, [toggleLike]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore: hasMore ?? false,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load feed') : null,
    filters,
    setFilters,
    loadMore,
    refresh,
    handleLike,
  };
}

/**
 * @deprecated 새 코드에서는 @/presentation/hooks/queries/usePublicFeed의 usePopularChurches 사용 권장
 */
export function usePopularChurches(limit = 10) {
  const { data: churches = [], isLoading } = usePopularChurchesQuery(limit);
  return { churches, isLoading };
}

// Intersection Observer 기반 무한 스크롤 훅
export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  isLoading: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (targetRef.current) {
      observerRef.current.observe(targetRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoading]);

  return targetRef;
}

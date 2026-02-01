'use client';

/**
 * Platform Stats React Query Hooks
 *
 * 플랫폼 전체 통계 관련 React Query 훅.
 * 홈 페이지에서 누적 나눔 수, 오늘 작성자 수 등을 표시하는데 사용.
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { getTodayDateString } from '@/lib/date-utils';

// Query Keys
export const platformStatsKeys = {
  all: ['platformStats'] as const,
  totalSharing: () => [...platformStatsKeys.all, 'totalSharing'] as const,
  todayWriters: () => [...platformStatsKeys.all, 'todayWriters'] as const,
  combined: () => [...platformStatsKeys.all, 'combined'] as const,
};

export interface PlatformStats {
  totalSharingCount: number; // 전체 누적 나눔 수 (묵상 + QT)
  todayPostsCount: number; // 오늘 작성된 글 개수
}

/**
 * 플랫폼 전체 통계 조회 훅 (누적 나눔 수 + 오늘 작성자 수)
 *
 * 조회 대상: unified_meditations (통합 테이블)
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: platformStatsKeys.combined(),
    queryFn: async (): Promise<PlatformStats> => {
      const supabase = getSupabaseBrowserClient();
      const today = getTodayDateString();
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      // unified_meditations에서 통합 조회 (병렬로 실행)
      const [totalResult, todayResult] = await Promise.all([
        // 1. 전체 나눔 수
        supabase
          .from('unified_meditations')
          .select('*', { count: 'exact', head: true }),

        // 2. 오늘 작성된 글 개수
        supabase
          .from('unified_meditations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
      ]);

      return {
        totalSharingCount: totalResult.count || 0,
        todayPostsCount: todayResult.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
  });
}

/**
 * 전체 누적 나눔 수만 조회하는 훅
 *
 * unified_meditations 단일 테이블에서 조회 (Phase 4 마이그레이션 완료)
 */
export function useTotalSharingCount() {
  return useQuery({
    queryKey: platformStatsKeys.totalSharing(),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();

      // unified_meditations에서 전체 카운트 조회 (단일 쿼리)
      const { count } = await supabase
        .from('unified_meditations')
        .select('*', { count: 'exact', head: true });

      return count || 0;
    },
    staleTime: 1000 * 60 * 10, // 10분
    refetchOnWindowFocus: false,
  });
}

/**
 * 오늘 작성자 수만 조회하는 훅
 *
 * unified_meditations 단일 테이블에서 조회 (Phase 4 마이그레이션 완료)
 */
export function useTodayWritersCount() {
  return useQuery({
    queryKey: platformStatsKeys.todayWriters(),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const today = getTodayDateString();
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      // unified_meditations에서 오늘 작성된 글의 user_id, guest_token 조회
      const { data } = await supabase
        .from('unified_meditations')
        .select('user_id, guest_token')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // 고유 작성자 수 계산 (로그인 유저 + 게스트)
      const uniqueWriters = new Set<string>();

      data?.forEach((item) => {
        if (item.user_id) {
          uniqueWriters.add(`user_${item.user_id}`);
        } else if (item.guest_token) {
          uniqueWriters.add(`guest_${item.guest_token}`);
        }
      });

      return uniqueWriters.size;
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
  });
}

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
 * 조회 대상 테이블:
 * - public_meditations: 공개 묵상
 * - church_qt_posts: 교회 QT
 * - guest_comments: 교회 짧은 묵상
 * - comments (is_public=true): 공개 그룹 묵상
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: platformStatsKeys.combined(),
    queryFn: async (): Promise<PlatformStats> => {
      const supabase = getSupabaseBrowserClient();
      const today = getTodayDateString();
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      // 병렬로 모든 쿼리 실행
      const [
        // 전체 카운트
        publicMeditationsTotalResult,
        churchQtTotalResult,
        guestCommentsTotalResult,
        groupCommentsTotalResult,
        // 오늘 글 개수
        todayPublicMeditationsResult,
        todayChurchQtResult,
        todayGuestCommentsResult,
        todayGroupCommentsResult,
      ] = await Promise.all([
        // 1. 전체 공개 묵상 수
        supabase
          .from('public_meditations')
          .select('*', { count: 'exact', head: true }),

        // 2. 전체 교회 QT 수
        supabase
          .from('church_qt_posts')
          .select('*', { count: 'exact', head: true }),

        // 3. 전체 교회 짧은 묵상 수 (guest_comments)
        supabase
          .from('guest_comments')
          .select('*', { count: 'exact', head: true }),

        // 4. 전체 공개 그룹 묵상 수 (comments with is_public=true)
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true),

        // 5. 오늘 작성된 공개 묵상 개수
        supabase
          .from('public_meditations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 6. 오늘 작성된 교회 QT 개수
        supabase
          .from('church_qt_posts')
          .select('*', { count: 'exact', head: true })
          .eq('qt_date', today),

        // 7. 오늘 작성된 교회 짧은 묵상 개수
        supabase
          .from('guest_comments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),

        // 8. 오늘 작성된 공개 그룹 묵상 개수
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
      ]);

      // 전체 나눔 수 계산 (모든 테이블 합산)
      const totalPublicMeditations = publicMeditationsTotalResult.count || 0;
      const totalChurchQt = churchQtTotalResult.count || 0;
      const totalGuestComments = guestCommentsTotalResult.count || 0;
      const totalGroupComments = groupCommentsTotalResult.count || 0;
      const totalSharingCount = totalPublicMeditations + totalChurchQt + totalGuestComments + totalGroupComments;

      // 오늘 작성된 글 개수 계산
      const todayPublicMeditations = todayPublicMeditationsResult.count || 0;
      const todayChurchQt = todayChurchQtResult.count || 0;
      const todayGuestComments = todayGuestCommentsResult.count || 0;
      const todayGroupComments = todayGroupCommentsResult.count || 0;
      const todayPostsCount = todayPublicMeditations + todayChurchQt + todayGuestComments + todayGroupComments;

      return {
        totalSharingCount,
        todayPostsCount,
      };
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
  });
}

/**
 * 전체 누적 나눔 수만 조회하는 훅
 */
export function useTotalSharingCount() {
  return useQuery({
    queryKey: platformStatsKeys.totalSharing(),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();

      const [
        publicMeditationsResult,
        churchQtResult,
        guestCommentsResult,
        groupCommentsResult,
      ] = await Promise.all([
        supabase
          .from('public_meditations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('church_qt_posts')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('guest_comments')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('is_public', true),
      ]);

      return (
        (publicMeditationsResult.count || 0) +
        (churchQtResult.count || 0) +
        (guestCommentsResult.count || 0) +
        (groupCommentsResult.count || 0)
      );
    },
    staleTime: 1000 * 60 * 10, // 10분
    refetchOnWindowFocus: false,
  });
}

/**
 * 오늘 작성자 수만 조회하는 훅
 */
export function useTodayWritersCount() {
  return useQuery({
    queryKey: platformStatsKeys.todayWriters(),
    queryFn: async (): Promise<number> => {
      const supabase = getSupabaseBrowserClient();
      const today = getTodayDateString();
      const todayStart = `${today}T00:00:00`;
      const todayEnd = `${today}T23:59:59`;

      const [
        publicMeditationsResult,
        churchQtResult,
        guestCommentsResult,
        groupCommentsResult,
      ] = await Promise.all([
        supabase
          .from('public_meditations')
          .select('user_id')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        supabase
          .from('church_qt_posts')
          .select('user_id')
          .eq('qt_date', today),
        supabase
          .from('guest_comments')
          .select('linked_user_id')
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
        supabase
          .from('comments')
          .select('user_id')
          .eq('is_public', true)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd),
      ]);

      const uniqueWriters = new Set<string>();

      publicMeditationsResult.data?.forEach((item) => {
        if (item.user_id) {
          uniqueWriters.add(item.user_id);
        }
      });

      churchQtResult.data?.forEach((item) => {
        if (item.user_id) {
          uniqueWriters.add(item.user_id);
        }
      });

      guestCommentsResult.data?.forEach((item) => {
        if (item.linked_user_id) {
          uniqueWriters.add(item.linked_user_id);
        }
      });

      groupCommentsResult.data?.forEach((item) => {
        if (item.user_id) {
          uniqueWriters.add(item.user_id);
        }
      });

      return uniqueWriters.size;
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchOnWindowFocus: false,
  });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import readingPlan from '@/data/reading_plan.json';

// 실제 통독 일정의 총 일수 (동적으로 계산)
export const TOTAL_READING_DAYS = readingPlan.length; // 271일

interface DashboardStats {
  readChapters: number;
  writtenQTs: number;
  streakDays: number;
  progressPercent: number;
}

async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = getSupabaseBrowserClient();

  // 1. 읽은 일수 (daily_checks에서 is_read가 true인 고유 day_number 수)
  const { data: checks, error: checksError } = await supabase
    .from('daily_checks')
    .select('day_number')
    .eq('user_id', userId)
    .eq('is_read', true);

  if (checksError) throw checksError;

  const uniqueDays = new Set(checks?.map((c) => c.day_number) || []);
  const readDays = uniqueDays.size;

  // 대략적인 장 수 계산 (일평균 3장 가정)
  const readChapters = readDays * 3;

  // 2. 작성한 QT 수 (unified_meditations에서 조회 - Phase 4 마이그레이션)
  const { count: qtCount, error: qtError } = await supabase
    .from('unified_meditations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (qtError) throw qtError;

  // 3. 연속 읽기 일수 계산
  const { data: recentChecks, error: recentError } = await supabase
    .from('daily_checks')
    .select('checked_at')
    .eq('user_id', userId)
    .eq('is_read', true)
    .order('checked_at', { ascending: false })
    .limit(365);

  if (recentError) throw recentError;

  let streakDays = 0;
  if (recentChecks && recentChecks.length > 0) {
    // 날짜별로 그룹화
    const checkedDates = new Set<string>();
    recentChecks.forEach((check) => {
      if (check.checked_at) {
        const date = new Date(check.checked_at).toISOString().split('T')[0];
        checkedDates.add(date);
      }
    });

    // 오늘부터 연속 일수 계산
    const today = new Date();
    const checkDate = new Date(today);

    // 오늘 체크했는지 확인, 안했으면 어제부터 시작
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!checkedDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (checkedDates.has(dateStr)) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 4. 진행률 (실제 통독 일정 기준)
  const progressPercent = Math.round((readDays / TOTAL_READING_DAYS) * 100);

  return {
    readChapters,
    writtenQTs: qtCount || 0,
    streakDays,
    progressPercent,
  };
}

export function useDashboardStats(userId: string | null) {
  return useQuery({
    queryKey: ['dashboardStats', userId],
    queryFn: () => fetchDashboardStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });
}

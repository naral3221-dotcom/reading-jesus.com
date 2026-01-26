'use client'

/**
 * Church Stats React Query Hooks
 *
 * 교회 통계 관련 React Query 훅.
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { getTodayDateString } from '@/lib/date-utils'
import readingPlan from '@/data/reading_plan.json'

// Query Keys
export const churchStatsKeys = {
  all: ['churchStats'] as const,
  todayStats: (churchId: string) => [...churchStatsKeys.all, 'today', churchId] as const,
  readingProgress: (churchId: string, userId: string) =>
    [...churchStatsKeys.all, 'readingProgress', churchId, userId] as const,
  completedDays: (churchId: string, userId: string) =>
    [...churchStatsKeys.all, 'completedDays', churchId, userId] as const,
  recentPosts: (churchId: string, limit: number) =>
    [...churchStatsKeys.all, 'recentPosts', churchId, limit] as const,
  userActivity: (churchId: string, userId: string) =>
    [...churchStatsKeys.all, 'userActivity', churchId, userId] as const,
}

interface ReadingDay {
  day: number
  date: string
}

export interface TodayStatsData {
  todayMeditations: number
  todayQT: number
  activeMembers: number
}

export interface ReadingProgressData {
  totalDays: number
  completedDays: number
  currentStreak: number
  weeklyGoal: number
  weeklyCompleted: number
}

export interface ChurchPost {
  id: string
  guest_name: string
  content: string
  is_anonymous: boolean
  created_at: string
  likes_count: number
}

export interface UserActivityStats {
  myPosts: number
  myQTs: number
}

/**
 * 오늘 통계 조회 훅
 */
export function useTodayStats(churchId: string | undefined) {
  return useQuery({
    queryKey: churchStatsKeys.todayStats(churchId ?? ''),
    queryFn: async (): Promise<TodayStatsData> => {
      if (!churchId)
        return {
          todayMeditations: 0,
          todayQT: 0,
          activeMembers: 0,
        }

      const supabase = getSupabaseBrowserClient()
      const today = getTodayDateString()
      const todayStart = `${today}T00:00:00`
      const todayEnd = `${today}T23:59:59`

      // 오늘 작성된 묵상 수
      const { count: meditationCount } = await supabase
        .from('guest_comments')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)

      // 오늘 작성된 QT 수
      const { count: qtCount } = await supabase
        .from('church_qt_posts')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('qt_date', today)

      // 활성 멤버 수 (이번 주 글 작성한 유저)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 7)
      const weekStartStr = weekStart.toISOString()

      const { data: activeUsers } = await supabase
        .from('guest_comments')
        .select('linked_user_id, device_id')
        .eq('church_id', churchId)
        .gte('created_at', weekStartStr)

      // 고유 사용자 수 계산
      const uniqueUsers = new Set<string>()
      activeUsers?.forEach((u) => {
        if (u.linked_user_id) {
          uniqueUsers.add(`user_${u.linked_user_id}`)
        } else if (u.device_id) {
          uniqueUsers.add(`device_${u.device_id}`)
        }
      })

      return {
        todayMeditations: meditationCount || 0,
        todayQT: qtCount || 0,
        activeMembers: uniqueUsers.size,
      }
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 읽기 진도 통계 훅
 */
export function useChurchReadingProgress(churchId: string | undefined, userId: string | null) {
  return useQuery({
    queryKey: churchStatsKeys.readingProgress(churchId ?? '', userId ?? ''),
    queryFn: async (): Promise<ReadingProgressData> => {
      const defaultData: ReadingProgressData = {
        totalDays: 365,
        completedDays: 0,
        currentStreak: 0,
        weeklyGoal: 7,
        weeklyCompleted: 0,
      }

      if (!churchId || !userId) return defaultData

      const supabase = getSupabaseBrowserClient()

      // 통독일정 전체 일수 (reading_plan.json 기준)
      const totalDays = (readingPlan as ReadingDay[]).length

      // 사용자의 읽음 완료 데이터 조회
      const { data: checks, error } = await supabase
        .from('church_reading_checks')
        .select('day_number, checked_at')
        .eq('user_id', userId)
        .eq('church_id', churchId)
        .order('checked_at', { ascending: false })

      if (error) {
        console.error('읽기 진도 로드 에러:', error)
        return defaultData
      }

      const completedDays = checks?.length || 0

      // 이번 주 완료 계산 (일요일 기준)
      const now = new Date()
      const dayOfWeek = now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - dayOfWeek)
      weekStart.setHours(0, 0, 0, 0)

      const weeklyCompleted =
        checks?.filter((check) => {
          const checkDate = new Date(check.checked_at)
          return checkDate >= weekStart
        }).length || 0

      // 연속 읽기 계산 (최근 연속으로 읽은 날 수)
      let currentStreak = 0
      if (checks && checks.length > 0) {
        // 날짜별로 그룹화 (같은 날 여러 번 체크해도 1일로)
        const uniqueDates = new Set<string>()
        checks.forEach((check) => {
          const dateStr = new Date(check.checked_at).toISOString().split('T')[0]
          uniqueDates.add(dateStr)
        })

        const sortedDates = Array.from(uniqueDates).sort().reverse()
        const today = getTodayDateString()
        // 어제 계산도 KST 기준으로
        const todayDate = new Date()
        const koreaOffset = 9 * 60
        const localOffset = todayDate.getTimezoneOffset()
        const koreaTime = new Date(todayDate.getTime() + (koreaOffset + localOffset) * 60 * 1000)
        koreaTime.setDate(koreaTime.getDate() - 1)
        const yesterday = `${koreaTime.getFullYear()}-${String(koreaTime.getMonth() + 1).padStart(2, '0')}-${String(koreaTime.getDate()).padStart(2, '0')}`

        // 오늘 또는 어제부터 시작하는지 확인
        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          currentStreak = 1
          let lastDate = new Date(sortedDates[0])

          for (let i = 1; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i])
            const diffDays = Math.round((lastDate.getTime() - currentDate.getTime()) / 86400000)

            if (diffDays === 1) {
              currentStreak++
              lastDate = currentDate
            } else {
              break
            }
          }
        }
      }

      return {
        totalDays,
        completedDays,
        currentStreak,
        weeklyGoal: 7,
        weeklyCompleted,
      }
    },
    enabled: !!churchId && !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 완료된 읽기 일자 Set 조회 훅 (캘린더용)
 */
export function useCompletedReadingDays(churchId: string | undefined, userId: string | null) {
  return useQuery({
    queryKey: churchStatsKeys.completedDays(churchId ?? '', userId ?? ''),
    queryFn: async (): Promise<Set<number>> => {
      if (!churchId || !userId) return new Set()

      const supabase = getSupabaseBrowserClient()

      const { data: checks, error } = await supabase
        .from('church_reading_checks')
        .select('day_number, checked_at')
        .eq('user_id', userId)
        .eq('church_id', churchId)

      if (error) {
        console.error('읽음 완료 데이터 로드 에러:', error)
        return new Set()
      }

      const completedSet = new Set<number>()
      checks?.forEach((check: { day_number: number }) => {
        completedSet.add(check.day_number)
      })

      return completedSet
    },
    enabled: !!churchId && !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 최근 교회 게시글 조회 훅 (나눔 콘텐츠용)
 */
export function useRecentChurchPosts(churchId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: churchStatsKeys.recentPosts(churchId ?? '', limit),
    queryFn: async (): Promise<ChurchPost[]> => {
      if (!churchId) return []

      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('guest_comments')
        .select('id, guest_name, content, is_anonymous, created_at, likes_count')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('게시글 로드 에러:', error)
        return []
      }

      return data || []
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 사용자 활동 통계 조회 훅 (마이페이지용)
 */
export function useUserActivityStats(churchId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: churchStatsKeys.userActivity(churchId ?? '', userId ?? ''),
    queryFn: async (): Promise<UserActivityStats> => {
      if (!churchId || !userId) return { myPosts: 0, myQTs: 0 }

      const supabase = getSupabaseBrowserClient()

      // 병렬로 두 개의 쿼리 실행
      const [postsResult, qtsResult] = await Promise.all([
        supabase
          .from('guest_comments')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('linked_user_id', userId),
        supabase
          .from('church_qt_posts')
          .select('*', { count: 'exact', head: true })
          .eq('church_id', churchId)
          .eq('user_id', userId),
      ])

      return {
        myPosts: postsResult.count || 0,
        myQTs: qtsResult.count || 0,
      }
    },
    enabled: !!churchId && !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

// ============================================================
// 랜딩 페이지 통계
// ============================================================

export interface LandingStats {
  users: number
  churches: number
  posts: number
}

/**
 * 랜딩 페이지 통계 조회 훅 (비로그인 사용자용)
 */
export function useLandingStats(enabled: boolean = true) {
  return useQuery({
    queryKey: [...churchStatsKeys.all, 'landing'] as const,
    queryFn: async (): Promise<LandingStats> => {
      const supabase = getSupabaseBrowserClient()

      // 병렬로 두 개의 쿼리 실행
      const [churchResult, postResult] = await Promise.all([
        supabase.from('churches').select('*', { count: 'exact', head: true }),
        supabase.from('guest_comments').select('*', { count: 'exact', head: true }),
      ])

      const churchCount = churchResult.count || 0
      const postCount = postResult.count || 0

      return {
        users: Math.floor(postCount / 3), // 대략적인 사용자 추정
        churches: churchCount,
        posts: postCount,
      }
    },
    enabled,
    staleTime: 1000 * 60 * 10, // 10분 (랜딩 페이지는 자주 갱신 불필요)
  })
}

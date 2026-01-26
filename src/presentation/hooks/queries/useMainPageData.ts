'use client'

/**
 * MainPageData React Query Hooks
 *
 * 메인 페이지 통합 데이터 관리를 위한 React Query 훅들입니다.
 * 여러 훅을 조합하여 중복 요청을 방지하고 효율적인 캐시 관리를 제공합니다.
 */

import { useQuery } from '@tanstack/react-query'
import { GetMainPageData } from '@/application/use-cases/main-page/GetMainPageData'
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository'
import { SupabaseChurchRepository } from '@/infrastructure/repositories/SupabaseChurchRepository'
import { SupabaseGroupRepository } from '@/infrastructure/repositories/SupabaseGroupRepository'
import { SupabaseUserDailyReadingRepository } from '@/infrastructure/repositories/SupabaseUserDailyReadingRepository'

// Query Key Factory
export const mainPageDataKeys = {
  all: ['mainPageData'] as const,
  byUser: (userId: string) => [...mainPageDataKeys.all, 'user', userId] as const,
}

// Repository 인스턴스 (싱글톤)
const userRepository = new SupabaseUserRepository()
const churchRepository = new SupabaseChurchRepository()
const groupRepository = new SupabaseGroupRepository()
const userDailyReadingRepository = new SupabaseUserDailyReadingRepository()

// Use Case 인스턴스
const getMainPageData = new GetMainPageData(
  userRepository,
  churchRepository,
  groupRepository,
  userDailyReadingRepository
)

/**
 * 메인 페이지 통합 데이터 조회 훅
 *
 * @param userId 사용자 ID
 * @returns 메인 페이지에 필요한 모든 데이터
 *
 * @example
 * const { data, isLoading } = useMainPageData(userId)
 * const { user, church, groups, dailyReadings } = data ?? {}
 */
export function useMainPageData(userId: string | null) {
  return useQuery({
    queryKey: mainPageDataKeys.byUser(userId ?? ''),
    queryFn: async () => {
      const result = await getMainPageData.execute({ userId })
      if (result.error) throw new Error(result.error)

      return {
        user: result.user,
        church: result.church,
        groups: result.groups,
        personalProjects: result.personalProjects,
        dailyReadings: result.dailyReadings.map((r) => r.toDTO()),
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2분 (메인 페이지는 자주 갱신 필요)
    gcTime: 1000 * 60 * 15, // 15분
    refetchOnWindowFocus: true, // 탭 전환 시 자동 갱신
  })
}

/**
 * 사용자 데이터만 선택적으로 가져오는 훅
 * (useMainPageData의 일부 데이터만 필요할 때)
 */
export function useMainPageUser(userId: string | null) {
  const { data, ...rest } = useMainPageData(userId)
  return {
    user: data?.user ?? null,
    church: data?.church ?? null,
    ...rest,
  }
}

/**
 * 그룹 데이터만 선택적으로 가져오는 훅
 */
export function useMainPageGroups(userId: string | null) {
  const { data, ...rest } = useMainPageData(userId)
  return {
    groups: data?.groups ?? [],
    ...rest,
  }
}

/**
 * 일일 읽기 데이터만 선택적으로 가져오는 훅
 */
export function useMainPageDailyReadings(userId: string | null) {
  const { data, ...rest } = useMainPageData(userId)
  return {
    dailyReadings: data?.dailyReadings ?? [],
    ...rest,
  }
}

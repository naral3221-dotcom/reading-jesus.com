'use client'

/**
 * MainDataContext - 메인 페이지 공통 데이터 Context
 *
 * 메인 페이지(/home, /community, /group)에서 공통으로 사용되는 데이터를 제공합니다.
 * - 사용자 정보
 * - 교회 정보
 * - 그룹 목록 및 활성 그룹
 * - 일일 읽기 정보
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react'
import { useMainPageData } from '@/presentation/hooks/queries/useMainPageData'
import { useCurrentUser } from '@/presentation/hooks/queries/useUser'
import { useGroupStore } from '@/presentation/hooks/stores/useGroupStore'
import type { User } from '@/domain/entities/User'
import type { Church } from '@/domain/entities/Church'
import type { Group } from '@/domain/entities/Group'
import type { GroupWithMemberCount } from '@/application/use-cases/main-page/GetMainPageData'
import type { UserDailyReading } from '@/types'

interface MainDataContextValue {
  // 사용자 데이터
  user: User | null
  church: Church | null

  // 그룹 데이터
  groups: GroupWithMemberCount[]
  activeGroup: Group | null
  activeGroupId: string | null
  setActiveGroupId: (id: string | null) => void

  // 일일 읽기 데이터
  dailyReadings: UserDailyReading[]

  // 로딩 상태
  isLoading: boolean
  isUserLoading: boolean
  isDataLoading: boolean

  // 에러 상태
  error: Error | null

  // 액션
  refetch: () => void
}

const MainDataContext = createContext<MainDataContextValue | undefined>(undefined)

/**
 * MainDataProvider - 메인 페이지 데이터 Provider
 *
 * Layout에서 사용하여 하위 컴포넌트에 데이터를 제공합니다.
 */
export function MainDataProvider({ children }: { children: React.ReactNode }) {
  // 사용자 인증 상태
  const { data: userData, isLoading: isUserLoading } = useCurrentUser()
  const userId = userData?.user?.id ?? null

  // 메인 페이지 통합 데이터
  const {
    data: mainData,
    isLoading: isDataLoading,
    error,
    refetch: refetchMainData,
  } = useMainPageData(userId)

  // 그룹 스토어 (활성 그룹 ID 관리)
  const { activeGroupId, setActiveGroupId } = useGroupStore()

  // 활성 그룹 찾기
  const activeGroup = useMemo(() => {
    if (!activeGroupId || !mainData?.groups) return null
    const found = mainData.groups.find((g) => g.group.id === activeGroupId)
    return found?.group ?? null
  }, [activeGroupId, mainData?.groups])

  // 활성 그룹 자동 설정 (첫 번째 그룹)
  React.useEffect(() => {
    if (!activeGroupId && mainData?.groups && mainData.groups.length > 0) {
      setActiveGroupId(mainData.groups[0].group.id)
    }
  }, [activeGroupId, mainData?.groups, setActiveGroupId])

  // 삭제된 그룹 자동 처리
  React.useEffect(() => {
    if (activeGroupId && mainData?.groups && !activeGroup) {
      // 현재 활성 그룹이 목록에 없으면 초기화
      const groupExists = mainData.groups.some((g) => g.group.id === activeGroupId)
      if (!groupExists && mainData.groups.length > 0) {
        setActiveGroupId(mainData.groups[0].group.id)
      } else if (!groupExists) {
        setActiveGroupId(null)
      }
    }
  }, [activeGroupId, activeGroup, mainData?.groups, setActiveGroupId])

  const refetch = useCallback(() => {
    refetchMainData()
  }, [refetchMainData])

  const value = useMemo<MainDataContextValue>(() => ({
    user: mainData?.user ?? null,
    church: mainData?.church ?? null,
    groups: mainData?.groups ?? [],
    activeGroup,
    activeGroupId,
    setActiveGroupId,
    dailyReadings: mainData?.dailyReadings ?? [],
    isLoading: isUserLoading || isDataLoading,
    isUserLoading,
    isDataLoading,
    error: error ?? null,
    refetch,
  }), [
    mainData,
    activeGroup,
    activeGroupId,
    setActiveGroupId,
    isUserLoading,
    isDataLoading,
    error,
    refetch,
  ])

  return (
    <MainDataContext.Provider value={value}>
      {children}
    </MainDataContext.Provider>
  )
}

/**
 * useMainData - Context 소비 훅
 *
 * @throws Error if used outside of MainDataProvider
 *
 * @example
 * const { user, groups, activeGroup, isLoading } = useMainData()
 */
export function useMainData(): MainDataContextValue {
  const context = useContext(MainDataContext)
  if (context === undefined) {
    throw new Error('useMainData must be used within a MainDataProvider')
  }
  return context
}

/**
 * useMainDataOptional - 선택적 Context 소비 훅
 *
 * Provider 외부에서도 사용 가능 (undefined 반환)
 */
export function useMainDataOptional(): MainDataContextValue | undefined {
  return useContext(MainDataContext)
}

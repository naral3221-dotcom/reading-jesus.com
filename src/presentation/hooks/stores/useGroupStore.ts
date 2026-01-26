'use client'

/**
 * Group Store (Zustand)
 *
 * 그룹 관련 전역 상태를 관리합니다.
 * 기존 GroupContext를 대체합니다.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useQueryClient } from '@tanstack/react-query'
import { useUserGroups, useGroupById, groupKeys } from '../queries/useGroup'
import { useCurrentUser } from '../queries/useUser'
import type { Group, BibleRangeType as TypesBibleRangeType } from '@/types'
import type { BibleRangeType as DomainBibleRangeType } from '@/domain/entities/Group'

// Domain BibleRangeType을 types BibleRangeType으로 변환
// Domain: 'full' | 'ot' | 'nt' | 'custom'
// Types: 'full' | 'old' | 'new' | 'custom' | 'reading_jesus'
function convertBibleRangeType(domainType: DomainBibleRangeType): TypesBibleRangeType {
  switch (domainType) {
    case 'ot':
      return 'old'
    case 'nt':
      return 'new'
    default:
      return domainType
  }
}

interface GroupState {
  // 상태
  activeGroupId: string | null

  // 액션
  setActiveGroupId: (groupId: string | null) => void

  // 초기화
  reset: () => void
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      // 초기 상태
      activeGroupId: null,

      // 액션
      setActiveGroupId: (activeGroupId) => set({ activeGroupId }),

      // 초기화
      reset: () => set({ activeGroupId: null }),
    }),
    {
      name: 'reading-jesus-active-group',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

/**
 * 기존 GroupContext와 호환되는 훅
 *
 * React Query의 useUserGroups와 Zustand의 useGroupStore를 결합하여
 * 기존 useGroup() 인터페이스와 동일하게 사용 가능
 *
 * @returns GroupContext와 동일한 인터페이스
 *
 * @example
 * // 기존 사용 방식 그대로 사용 가능
 * const { activeGroup, groups, loading, setActiveGroup, refreshGroups } = useGroupCompat()
 */
export function useGroupCompat() {
  const { activeGroupId, setActiveGroupId } = useGroupStore()
  const queryClient = useQueryClient()

  // 현재 사용자 정보 조회
  const { data: userData } = useCurrentUser()
  const userId = userData?.user?.id || null

  // 사용자의 그룹 목록 조회
  const {
    data: groupsData,
    isLoading: isLoadingGroups,
  } = useUserGroups(userId)

  // 활성 그룹 정보 조회
  const {
    data: activeGroupData,
    isLoading: isLoadingActiveGroup,
    isError: isActiveGroupError,
  } = useGroupById(activeGroupId)

  // 그룹 조회 실패 시 (삭제된 그룹) activeGroupId 초기화
  if (activeGroupId && !isLoadingActiveGroup && !activeGroupData?.group && !isActiveGroupError) {
    // 그룹이 존재하지 않으면 localStorage에서 제거
    setTimeout(() => setActiveGroupId(null), 0)
  }

  // 그룹 목록을 types/Group 형태로 변환
  // groupsData는 GroupWithMemberCount[] 형태: { group: Group, memberCount: number }
  const groups: Group[] = (groupsData || []).map((item) => {
    const g = item.group
    return {
      id: g.id,
      name: g.name,
      description: g.description,
      start_date: g.startDate,
      end_date: g.endDate || null,
      invite_code: g.inviteCode,
      created_by: g.createdBy,
      created_at: g.createdAt,
      reading_plan_type: g.readingPlanType as '365' | '180' | '90' | 'custom',
      goal: g.goal,
      rules: g.rules,
      is_public: g.isPublic,
      max_members: g.maxMembers,
      allow_anonymous: g.allowAnonymous,
      require_daily_reading: g.requireDailyReading,
      bible_range_type: convertBibleRangeType(g.bibleRangeType),
      bible_range_books: g.bibleRangeBooks,
      schedule_mode: g.scheduleMode,
      church_id: g.churchId,
      is_church_official: g.isChurchOfficial,
    }
  })

  // 활성 그룹 객체 (있으면 groups에서 찾거나, activeGroupData에서 변환)
  let activeGroup: Group | null = null
  if (activeGroupId) {
    // 먼저 groups에서 찾기 (더 효율적)
    activeGroup = groups.find((g) => g.id === activeGroupId) || null

    // groups에 없으면 activeGroupData에서 변환
    if (!activeGroup && activeGroupData?.group) {
      const g = activeGroupData.group
      activeGroup = {
        id: g.id,
        name: g.name,
        description: g.description,
        start_date: g.startDate,
        end_date: g.endDate || null,
        invite_code: g.inviteCode,
        created_by: g.createdBy,
        created_at: g.createdAt,
        reading_plan_type: g.readingPlanType as '365' | '180' | '90' | 'custom',
        goal: g.goal,
        rules: g.rules,
        is_public: g.isPublic,
        max_members: g.maxMembers,
        allow_anonymous: g.allowAnonymous,
        require_daily_reading: g.requireDailyReading,
        bible_range_type: convertBibleRangeType(g.bibleRangeType),
        bible_range_books: g.bibleRangeBooks,
        schedule_mode: g.scheduleMode,
        church_id: g.churchId,
        is_church_official: g.isChurchOfficial,
      }
    }
  }

  // 첫 로드 시 activeGroupId가 없으면 첫 번째 그룹 선택
  // (React Query 데이터 로드 완료 후에만 실행)
  if (!activeGroupId && groups.length > 0 && !isLoadingGroups) {
    // 다음 렌더링 사이클에서 업데이트 (무한 루프 방지)
    setTimeout(() => setActiveGroupId(groups[0].id), 0)
  }

  return {
    // 상태
    activeGroup,
    groups,
    loading: isLoadingGroups || isLoadingActiveGroup,

    // 액션
    setActiveGroup: (group: Group) => {
      setActiveGroupId(group.id)
    },

    // 그룹 목록 새로고침
    refreshGroups: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: groupKeys.byUser(userId) })
      }
    },
  }
}

'use client'

/**
 * UserPlans React Query Hooks
 *
 * 사용자가 속한 그룹/교회의 읽기 플랜 정보를 조회하는 훅.
 */

import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from './useUser'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { READING_JESUS_2026_PLAN_ID } from '@/types'

// Query Keys
export const userPlanKeys = {
  all: ['userPlans'] as const,
  byUser: (userId: string) => [...userPlanKeys.all, 'byUser', userId] as const,
}

export interface PlanOption {
  id: string
  name: string
  type: 'reading_jesus' | 'custom'
  groupName: string
  groupType: 'group' | 'church'
}

interface GroupData {
  id: string
  name: string
  bible_range_type: string
  plan_id: string | null
  church_id: string | null
}

// Supabase는 단일 관계도 배열로 반환할 수 있음
interface GroupMembershipRow {
  group_id: string
  groups: GroupData | GroupData[] | null
}

/**
 * 사용자의 플랜 목록 조회 훅
 *
 * 사용자가 속한 그룹들의 플랜 정보를 조회하고
 * 중복 없이 플랜 옵션 목록을 반환합니다.
 */
export function useUserPlans() {
  const { data: userData, isLoading: isUserLoading } = useCurrentUser()
  const userId = userData?.user?.id ?? null

  const query = useQuery({
    queryKey: userPlanKeys.byUser(userId ?? ''),
    queryFn: async (): Promise<PlanOption[]> => {
      if (!userId) return []

      const supabase = getSupabaseBrowserClient()
      const planOptions: PlanOption[] = []
      const addedPlanIds = new Set<string>()

      // 사용자가 속한 그룹 목록 조회 (plan_id 포함)
      const { data: groupMemberships, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            bible_range_type,
            plan_id,
            church_id
          )
        `)
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to load user plans:', error)
        return []
      }

      if (!groupMemberships) return []

      for (const membership of groupMemberships as unknown as GroupMembershipRow[]) {
        // Supabase는 단일 관계도 배열로 반환할 수 있음
        const groupData = Array.isArray(membership.groups)
          ? membership.groups[0]
          : membership.groups
        if (!groupData) continue

        const isReadingJesus =
          groupData.bible_range_type === 'reading_jesus' ||
          groupData.plan_id === READING_JESUS_2026_PLAN_ID ||
          !groupData.plan_id

        if (isReadingJesus) {
          // 리딩지저스는 하나만 추가 (중복 방지)
          if (!addedPlanIds.has(READING_JESUS_2026_PLAN_ID)) {
            addedPlanIds.add(READING_JESUS_2026_PLAN_ID)
            planOptions.push({
              id: READING_JESUS_2026_PLAN_ID,
              name: '리딩지저스 2026',
              type: 'reading_jesus',
              groupName: groupData.name,
              groupType: groupData.church_id ? 'church' : 'group',
            })
          }
        } else if (groupData.plan_id && !addedPlanIds.has(groupData.plan_id)) {
          // 커스텀 플랜
          addedPlanIds.add(groupData.plan_id)
          planOptions.push({
            id: groupData.plan_id,
            name: `커스텀 플랜 (${groupData.name})`,
            type: 'custom',
            groupName: groupData.name,
            groupType: groupData.church_id ? 'church' : 'group',
          })
        }
      }

      // 그룹이 있지만 리딩지저스가 추가되지 않았다면 기본으로 추가
      if (
        !addedPlanIds.has(READING_JESUS_2026_PLAN_ID) &&
        groupMemberships.length > 0
      ) {
        const firstMembership = groupMemberships[0] as unknown as GroupMembershipRow
        const firstGroup = Array.isArray(firstMembership?.groups)
          ? firstMembership.groups[0]
          : firstMembership?.groups
        addedPlanIds.add(READING_JESUS_2026_PLAN_ID)
        planOptions.push({
          id: READING_JESUS_2026_PLAN_ID,
          name: '리딩지저스 2026',
          type: 'reading_jesus',
          groupName: firstGroup?.name || '그룹',
          groupType: firstGroup?.church_id ? 'church' : 'group',
        })
      }

      return planOptions
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  })

  return {
    ...query,
    isLoading: isUserLoading || query.isLoading,
  }
}

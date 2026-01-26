'use client'

/**
 * Group React Query Hooks
 *
 * 그룹 관련 React Query 훅들입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabaseGroupRepository } from '@/infrastructure/repositories/SupabaseGroupRepository'
import {
  GetGroup,
  GetUserGroups,
  JoinGroup,
  LeaveGroup,
  GetGroupMembers,
} from '@/application/use-cases'
import type { GroupSearchParams } from '@/domain/repositories/IGroupRepository'
import type { RankPermissions } from '@/types'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'

// Repository 싱글톤
const groupRepository = new SupabaseGroupRepository()

// Use Case 인스턴스 (캐싱)
const getGroupUseCase = new GetGroup(groupRepository)
const getUserGroupsUseCase = new GetUserGroups(groupRepository)
const joinGroupUseCase = new JoinGroup(groupRepository)
const leaveGroupUseCase = new LeaveGroup(groupRepository)
const getGroupMembersUseCase = new GetGroupMembers(groupRepository)

// Query Keys
export const groupKeys = {
  all: ['group'] as const,
  byId: (id: string) => [...groupKeys.all, 'byId', id] as const,
  byInviteCode: (code: string) => [...groupKeys.all, 'byInviteCode', code] as const,
  byUser: (userId: string) => [...groupKeys.all, 'byUser', userId] as const,
  members: (groupId: string) => [...groupKeys.all, 'members', groupId] as const,
  search: (params: GroupSearchParams) => [...groupKeys.all, 'search', params] as const,
  memberRole: (groupId: string, userId: string) => [...groupKeys.all, 'memberRole', groupId, userId] as const,
  memberPermissions: (groupId: string, userId: string) => [...groupKeys.all, 'memberPermissions', groupId, userId] as const,
}

/**
 * ID로 그룹 조회
 */
export function useGroupById(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.byId(groupId || ''),
    queryFn: async () => {
      if (!groupId) return null
      const result = await getGroupUseCase.execute({ groupId })
      if (result.error) throw new Error(result.error)
      return { group: result.group, memberCount: result.memberCount }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 초대 코드로 그룹 조회
 */
export function useGroupByInviteCode(inviteCode: string | null) {
  return useQuery({
    queryKey: groupKeys.byInviteCode(inviteCode || ''),
    queryFn: async () => {
      if (!inviteCode) return null
      const result = await getGroupUseCase.execute({ inviteCode })
      if (result.error) throw new Error(result.error)
      return { group: result.group, memberCount: result.memberCount }
    },
    enabled: !!inviteCode,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 사용자의 그룹 목록 조회
 */
export function useUserGroups(userId: string | null) {
  return useQuery({
    queryKey: groupKeys.byUser(userId || ''),
    queryFn: async () => {
      if (!userId) return []
      const result = await getUserGroupsUseCase.execute({ userId })
      if (result.error) throw new Error(result.error)
      return result.groups
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 그룹 멤버 목록 조회
 */
export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.members(groupId || ''),
    queryFn: async () => {
      if (!groupId) return { members: [], totalCount: 0 }
      const result = await getGroupMembersUseCase.execute({ groupId })
      if (result.error) throw new Error(result.error)
      return { members: result.members, totalCount: result.totalCount }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 그룹 검색
 */
export function useSearchGroups(params: GroupSearchParams | null) {
  return useQuery({
    queryKey: groupKeys.search(params || {}),
    queryFn: async () => {
      if (!params) return []
      return await groupRepository.search(params)
    },
    enabled: !!params,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 그룹 가입 Mutation
 */
export function useJoinGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { userId: string; groupId?: string; inviteCode?: string }) => {
      const result = await joinGroupUseCase.execute(input)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: (_, variables) => {
      // 사용자 그룹 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.byUser(variables.userId) })
      // 그룹 멤버 목록 캐시 무효화
      if (variables.groupId) {
        queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) })
        queryClient.invalidateQueries({ queryKey: groupKeys.byId(variables.groupId) })
      }
    },
  })
}

/**
 * 그룹 탈퇴 Mutation
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { userId: string; groupId: string }) => {
      const result = await leaveGroupUseCase.execute(input)
      if (!result.success) throw new Error(result.error || '그룹 탈퇴 실패')
      return result
    },
    onSuccess: (_, variables) => {
      // 사용자 그룹 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.byUser(variables.userId) })
      // 그룹 멤버 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: groupKeys.members(variables.groupId) })
      queryClient.invalidateQueries({ queryKey: groupKeys.byId(variables.groupId) })
    },
  })
}

// =============================================
// 그룹 멤버 역할/권한 관련 훅
// =============================================

// 기본 권한 (등급이 없는 일반 멤버용)
const DEFAULT_MEMBER_PERMISSIONS: RankPermissions = {
  can_read: true,
  can_comment: true,
  can_create_meeting: false,
  can_pin_comment: false,
  can_manage_members: false,
}

// 관리자 권한 (모든 권한 부여)
const ADMIN_PERMISSIONS: RankPermissions = {
  can_read: true,
  can_comment: true,
  can_create_meeting: true,
  can_pin_comment: true,
  can_manage_members: true,
}

/**
 * 멤버 역할 정보
 */
export interface GroupMemberRoleInfo {
  role: 'admin' | 'member' | null
  rankId: string | null
}

/**
 * 특정 사용자의 그룹 내 역할 조회
 */
export function useGroupMemberRole(groupId: string | null, userId: string | null) {
  return useQuery({
    queryKey: groupKeys.memberRole(groupId || '', userId || ''),
    queryFn: async (): Promise<GroupMemberRoleInfo> => {
      if (!groupId || !userId) return { role: null, rankId: null }

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('group_members')
        .select('role, rank_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle()  // 결과가 없어도 에러가 아님

      if (error) {
        console.error('멤버 역할 조회 에러:', error)
        return { role: null, rankId: null }
      }

      if (!data) {
        return { role: null, rankId: null }
      }

      return {
        role: data.role as 'admin' | 'member',
        rankId: data.rank_id,
      }
    },
    enabled: !!groupId && !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

/**
 * 특정 사용자가 그룹 관리자인지 확인
 */
export function useIsGroupAdmin(groupId: string | null, userId: string | null) {
  const { data, isLoading, error } = useGroupMemberRole(groupId, userId)

  return {
    isAdmin: data?.role === 'admin',
    isLoading,
    error,
    role: data?.role ?? null,
  }
}

/**
 * 멤버 권한 정보
 */
export interface GroupMemberPermissionsInfo {
  isAdmin: boolean
  permissions: RankPermissions
  rankId: string | null
}

/**
 * 멤버의 권한 조회 (rank 기반)
 * - 관리자(admin role)는 모든 권한
 * - 일반 멤버는 rank_id가 있으면 해당 등급의 권한
 * - rank_id가 없으면 기본 권한
 */
export function useGroupMemberPermissions(groupId: string | null, userId: string | null) {
  return useQuery({
    queryKey: groupKeys.memberPermissions(groupId || '', userId || ''),
    queryFn: async (): Promise<GroupMemberPermissionsInfo> => {
      if (!groupId || !userId) {
        return {
          isAdmin: false,
          permissions: DEFAULT_MEMBER_PERMISSIONS,
          rankId: null,
        }
      }

      const supabase = getSupabaseBrowserClient()

      // 1. 멤버 정보 조회 (role, rank_id)
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('role, rank_id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle()  // 결과가 없어도 에러가 아님

      if (memberError) {
        console.error('멤버 권한 조회 에러:', memberError)
        return {
          isAdmin: false,
          permissions: DEFAULT_MEMBER_PERMISSIONS,
          rankId: null,
        }
      }

      if (!memberData) {
        return {
          isAdmin: false,
          permissions: DEFAULT_MEMBER_PERMISSIONS,
          rankId: null,
        }
      }

      const isAdminRole = memberData.role === 'admin'

      // 2. 관리자인 경우 모든 권한 부여
      if (isAdminRole) {
        return {
          isAdmin: true,
          permissions: ADMIN_PERMISSIONS,
          rankId: memberData.rank_id,
        }
      }

      // 3. rank_id가 있으면 등급 권한 조회
      if (memberData.rank_id) {
        const { data: rankData, error: rankError } = await supabase
          .from('member_ranks')
          .select('permissions')
          .eq('id', memberData.rank_id)
          .single()

        if (!rankError && rankData?.permissions) {
          return {
            isAdmin: false,
            permissions: rankData.permissions as RankPermissions,
            rankId: memberData.rank_id,
          }
        }
      }

      // 4. 등급이 없는 일반 멤버는 기본 권한
      return {
        isAdmin: false,
        permissions: DEFAULT_MEMBER_PERMISSIONS,
        rankId: memberData.rank_id,
      }
    },
    enabled: !!groupId && !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

export interface ChurchGroup {
  id: string
  name: string
  description: string | null
  is_private: boolean
  member_count: number
}

/**
 * 교회별 그룹 목록 조회 훅
 */
export function useChurchGroups(churchId: string | undefined) {
  return useQuery({
    queryKey: [...groupKeys.all, 'byChurch', churchId ?? ''],
    queryFn: async (): Promise<ChurchGroup[]> => {
      if (!churchId) return []

      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description, is_private')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('그룹 목록 로드 에러:', error)
        return []
      }

      if (!data) return []

      // 각 그룹의 멤버 수 계산
      const groupsWithCount = await Promise.all(
        data.map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return {
            ...group,
            member_count: count || 0,
          }
        })
      )

      return groupsWithCount
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 5, // 5분
  })
}

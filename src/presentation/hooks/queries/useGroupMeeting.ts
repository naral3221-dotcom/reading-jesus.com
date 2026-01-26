'use client'

/**
 * Group Meeting React Query Hooks
 *
 * 그룹 모임 관련 React Query 훅들입니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { GroupMeetingWithHost, MeetingPurpose } from '@/types/meeting'

// Query Keys
export const groupMeetingKeys = {
  all: ['groupMeeting'] as const,
  byGroup: (groupId: string) => [...groupMeetingKeys.all, 'byGroup', groupId] as const,
  byId: (meetingId: string) => [...groupMeetingKeys.all, 'byId', meetingId] as const,
}

/**
 * 그룹 모임 목록 조회
 */
export function useGroupMeetings(groupId: string | null, userId: string | null) {
  return useQuery({
    queryKey: groupMeetingKeys.byGroup(groupId || ''),
    queryFn: async (): Promise<GroupMeetingWithHost[]> => {
      if (!groupId) return []

      const supabase = getSupabaseBrowserClient()

      try {
        // 먼저 모임 데이터만 조회
        const { data, error } = await supabase
          .from('group_meetings')
          .select('*')
          .eq('group_id', groupId)
          .order('meeting_date', { ascending: true })

        if (error) {
          // 테이블이 없는 경우 조용히 빈 배열 반환 (정상 동작)
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return []
          }
          throw error
        }

        if (!data) return []

        // 각 모임의 호스트 정보, 참가자 수 및 내 참여 상태 확인
        const meetingsWithDetails = await Promise.all(
          data.map(async (meeting) => {
            // 호스트 프로필 조회
            let hostProfile = { nickname: '알 수 없음', avatar_url: null }
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('nickname, avatar_url')
                .eq('id', meeting.host_id)
                .maybeSingle()
              if (profile) {
                hostProfile = profile
              }
            } catch {
              // 프로필 조회 실패해도 계속 진행
            }

            // 참가자 수 조회
            let count = 0
            try {
              const result = await supabase
                .from('meeting_participants')
                .select('*', { count: 'exact', head: true })
                .eq('meeting_id', meeting.id)
                .neq('status', 'cancelled')
              count = result.count || 0
            } catch {
              // 참가자 테이블이 없어도 계속 진행
            }

            // 내 참여 상태 조회
            let myParticipation = null
            if (userId) {
              try {
                const { data: participation } = await supabase
                  .from('meeting_participants')
                  .select('*')
                  .eq('meeting_id', meeting.id)
                  .eq('user_id', userId)
                  .maybeSingle()
                myParticipation = participation
              } catch {
                // 참가자 테이블이 없어도 계속 진행
              }
            }

            return {
              ...meeting,
              host: hostProfile,
              participant_count: count,
              is_participant: !!myParticipation && myParticipation.status !== 'cancelled',
              my_participation: myParticipation,
            }
          })
        )

        return meetingsWithDetails
      } catch (err) {
        console.error('모임 목록 조회 실패:', err)
        return []
      }
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 모임 생성 입력 타입
 */
export interface CreateMeetingInput {
  groupId: string
  hostId: string
  title: string
  description?: string | null
  meetingDate: Date
  location?: string | null
  isOnline: boolean
  onlineLink?: string | null
  maxParticipants: number
  purpose?: MeetingPurpose | null
}

/**
 * 모임 생성 Mutation
 */
export function useCreateMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingInput) => {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from('group_meetings')
        .insert({
          group_id: input.groupId,
          host_id: input.hostId,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          meeting_date: input.meetingDate.toISOString(),
          location: !input.isOnline ? input.location?.trim() : null,
          is_online: input.isOnline,
          online_link: input.isOnline ? input.onlineLink?.trim() : null,
          max_participants: input.maxParticipants,
          purpose: input.purpose || null,
          status: 'upcoming',
        })
        .select()
        .single()

      if (error) {
        // 테이블이 없는 경우
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          throw new Error('모임 기능 준비 중입니다. DB 설정이 필요합니다.')
        }
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupMeetingKeys.byGroup(variables.groupId) })
    },
  })
}

/**
 * 모임 참여 Mutation
 */
export function useJoinMeeting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meetingId, userId }: { meetingId: string; userId: string; groupId: string }) => {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from('meeting_participants')
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          status: 'confirmed',
        })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupMeetingKeys.byGroup(variables.groupId) })
    },
  })
}

/**
 * 모임 참여 취소 Mutation
 */
export function useCancelMeetingParticipation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ participationId }: { participationId: string; groupId: string }) => {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from('meeting_participants')
        .delete()
        .eq('id', participationId)

      if (error) {
        throw new Error(error.message)
      }

      return { success: true }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupMeetingKeys.byGroup(variables.groupId) })
    },
  })
}

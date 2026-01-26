'use client'

/**
 * Encouragement React Query Hooks
 *
 * 격려 메시지 관련 React Query 훅.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { EncouragementWithProfile } from '@/types'

// Query Keys
export const encouragementKeys = {
  all: ['encouragement'] as const,
  byGroup: (groupId: string) => [...encouragementKeys.all, 'group', groupId] as const,
  byUser: (userId: string) => [...encouragementKeys.all, 'user', userId] as const,
  received: (userId: string, groupId?: string) =>
    [...encouragementKeys.all, 'received', userId, groupId ?? 'all'] as const,
  unreadCount: (userId: string, groupId?: string) =>
    [...encouragementKeys.all, 'unreadCount', userId, groupId ?? 'all'] as const,
}

export interface SendEncouragementInput {
  groupId: string
  senderId: string
  receiverId: string
  message: string
}

export interface SendEncouragementResult {
  success: boolean
  error?: string
  isDuplicate?: boolean
}

/**
 * 격려 메시지 전송 뮤테이션 훅
 */
export function useSendEncouragement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SendEncouragementInput): Promise<SendEncouragementResult> => {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase.from('encouragements').insert({
        group_id: input.groupId,
        sender_id: input.senderId,
        receiver_id: input.receiverId,
        message: input.message,
      })

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - 하루에 한 번만
          return { success: false, isDuplicate: true }
        }
        return { success: false, error: error.message }
      }

      return { success: true }
    },
    onSuccess: (_, input) => {
      // 수신자의 격려 목록 및 읽지 않은 개수 갱신
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.received(input.receiverId),
      })
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.unreadCount(input.receiverId),
      })
    },
  })
}

/**
 * 받은 격려 메시지 목록 조회 훅
 */
export function useReceivedEncouragements(
  userId: string | null,
  groupId?: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: encouragementKeys.received(userId ?? '', groupId),
    queryFn: async (): Promise<EncouragementWithProfile[]> => {
      if (!userId) return []

      const supabase = getSupabaseBrowserClient()

      let query = supabase
        .from('encouragements')
        .select(
          `
          *,
          sender:profiles!encouragements_sender_id_fkey(nickname, avatar_url)
        `
        )
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (groupId) {
        query = query.eq('group_id', groupId)
      }

      const { data, error } = await query

      if (error) {
        console.error('격려 목록 로드 에러:', error)
        return []
      }

      return (data || []) as EncouragementWithProfile[]
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2분
  })
}

/**
 * 읽지 않은 격려 개수 조회 훅
 */
export function useUnreadEncouragementCount(userId: string | null, groupId?: string) {
  return useQuery({
    queryKey: encouragementKeys.unreadCount(userId ?? '', groupId),
    queryFn: async (): Promise<number> => {
      if (!userId) return 0

      const supabase = getSupabaseBrowserClient()

      let query = supabase
        .from('encouragements')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (groupId) {
        query = query.eq('group_id', groupId)
      }

      const { count, error } = await query

      if (error) {
        console.error('읽지 않은 격려 개수 로드 에러:', error)
        return 0
      }

      return count || 0
    },
    enabled: !!userId,
    staleTime: 1000 * 30, // 30초
  })
}

/**
 * 격려 읽음 처리 뮤테이션 훅
 */
export function useMarkEncouragementAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      groupId,
    }: {
      id: string
      userId: string
      groupId?: string
    }) => {
      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from('encouragements')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      return { userId, groupId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.received(data.userId, data.groupId),
      })
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.unreadCount(data.userId, data.groupId),
      })
    },
  })
}

/**
 * 모든 격려 읽음 처리 뮤테이션 훅
 */
export function useMarkAllEncouragementAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ids,
      userId,
      groupId,
    }: {
      ids: string[]
      userId: string
      groupId?: string
    }) => {
      if (ids.length === 0) return { userId, groupId }

      const supabase = getSupabaseBrowserClient()

      const { error } = await supabase
        .from('encouragements')
        .update({ is_read: true })
        .in('id', ids)

      if (error) throw error
      return { userId, groupId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.received(data.userId, data.groupId),
      })
      queryClient.invalidateQueries({
        queryKey: encouragementKeys.unreadCount(data.userId, data.groupId),
      })
    },
  })
}

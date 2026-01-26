'use client'

/**
 * Notification React Query Hooks
 *
 * 알림 데이터 관리를 위한 React Query 훅들.
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { GetNotifications } from '@/application/use-cases/notification/GetNotifications'
import { GetUnreadCount } from '@/application/use-cases/notification/GetUnreadCount'
import { MarkAsRead } from '@/application/use-cases/notification/MarkAsRead'
import { MarkAllAsRead } from '@/application/use-cases/notification/MarkAllAsRead'
import { SupabaseNotificationRepository } from '@/infrastructure/repositories/SupabaseNotificationRepository'

// Query Key Factory
export const notificationKeys = {
  all: ['notification'] as const,
  byUserId: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
  infinite: (userId: string) => [...notificationKeys.all, 'infinite', userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
}

// Repository 인스턴스 (싱글톤)
const notificationRepository = new SupabaseNotificationRepository()

/**
 * 알림 목록 조회 훅
 */
export function useNotifications(
  userId: string | null,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number; enabled?: boolean }
) {
  const getNotifications = new GetNotifications(notificationRepository)

  return useQuery({
    queryKey: notificationKeys.byUserId(userId ?? ''),
    queryFn: async () => {
      if (!userId) return { notifications: [], error: null }

      const result = await getNotifications.execute({
        userId,
        unreadOnly: options?.unreadOnly,
        limit: options?.limit,
        offset: options?.offset,
      })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 60 * 1, // 1분
  })
}

/**
 * 알림 목록 무한 스크롤 훅
 */
export function useInfiniteNotifications(
  userId: string | null,
  pageSize: number = 20
) {
  const getNotifications = new GetNotifications(notificationRepository)

  return useInfiniteQuery({
    queryKey: notificationKeys.infinite(userId ?? ''),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { notifications: [], hasMore: false }

      const result = await getNotifications.execute({
        userId,
        limit: pageSize,
        offset: pageParam,
      })

      if (result.error) throw new Error(result.error)

      return {
        notifications: result.notifications,
        hasMore: result.notifications.length === pageSize,
        nextOffset: pageParam + pageSize,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextOffset : undefined,
    enabled: !!userId,
    staleTime: 1000 * 60 * 1, // 1분
  })
}

/**
 * 읽지 않은 알림 개수 조회 훅
 */
export function useUnreadNotificationCount(userId: string | null, options?: { enabled?: boolean }) {
  const getUnreadCount = new GetUnreadCount(notificationRepository)

  return useQuery({
    queryKey: notificationKeys.unreadCount(userId ?? ''),
    queryFn: async () => {
      if (!userId) return { count: 0, error: null }

      const result = await getUnreadCount.execute({ userId })

      if (result.error) throw new Error(result.error)
      return result
    },
    enabled: options?.enabled !== false && !!userId,
    staleTime: 1000 * 30, // 30초
    refetchInterval: 1000 * 60, // 1분마다 자동 리페치
  })
}

/**
 * 알림 읽음 처리 뮤테이션 훅
 */
export function useMarkAsRead(userId: string) {
  const queryClient = useQueryClient()
  const markAsRead = new MarkAsRead(notificationRepository)

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markAsRead.execute({ id })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 알림 목록과 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.byUserId(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) })
    },
  })
}

/**
 * 모든 알림 읽음 처리 뮤테이션 훅
 */
export function useMarkAllAsRead(userId: string) {
  const queryClient = useQueryClient()
  const markAllAsRead = new MarkAllAsRead(notificationRepository)

  return useMutation({
    mutationFn: async () => {
      const result = await markAllAsRead.execute({ userId })
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // 알림 목록과 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.byUserId(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) })
    },
  })
}

/**
 * 알림 삭제 뮤테이션 훅
 */
export function useDeleteNotification(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationRepository.delete(id)
      return { success: true }
    },
    onSuccess: () => {
      // 알림 목록과 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: notificationKeys.byUserId(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) })
    },
  })
}

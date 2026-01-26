/**
 * useUserFollow - 팔로우 관계 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { SupabaseUserFollowRepository } from '@/infrastructure/repositories/SupabaseUserFollowRepository'
import {
  FollowUser,
  UnfollowUser,
  GetFollowers,
  GetFollowing,
  CheckIsFollowing,
} from '@/application/use-cases/user-follow'

// Query Keys
export const userFollowKeys = {
  all: ['user-follows'] as const,
  followers: (userId: string) => [...userFollowKeys.all, 'followers', userId] as const,
  following: (userId: string) => [...userFollowKeys.all, 'following', userId] as const,
  followingIds: (userId: string) => [...userFollowKeys.all, 'following-ids', userId] as const,
  isFollowing: (followerId: string, followingId: string) =>
    [...userFollowKeys.all, 'is-following', followerId, followingId] as const,
  profile: (userId: string) => [...userFollowKeys.all, 'profile', userId] as const,
}

// 팔로워 목록 조회 (무한 스크롤)
export function useFollowers(userId: string, currentUserId?: string) {
  return useInfiniteQuery({
    queryKey: userFollowKeys.followers(userId),
    queryFn: async ({ pageParam = 0 }) => {
      const repository = new SupabaseUserFollowRepository()
      const useCase = new GetFollowers(repository)
      const data = await useCase.execute({
        userId,
        limit: 20,
        offset: pageParam,
        currentUserId,
      })
      return {
        data,
        nextOffset: data.length === 20 ? pageParam + 20 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!userId,
  })
}

// 팔로잉 목록 조회 (무한 스크롤)
export function useFollowing(userId: string, currentUserId?: string) {
  return useInfiniteQuery({
    queryKey: userFollowKeys.following(userId),
    queryFn: async ({ pageParam = 0 }) => {
      const repository = new SupabaseUserFollowRepository()
      const useCase = new GetFollowing(repository)
      const data = await useCase.execute({
        userId,
        limit: 20,
        offset: pageParam,
        currentUserId,
      })
      return {
        data,
        nextOffset: data.length === 20 ? pageParam + 20 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    initialPageParam: 0,
    enabled: !!userId,
  })
}

// 팔로잉 ID 목록 조회 (피드 조회용)
export function useFollowingIds(userId: string | null) {
  return useQuery({
    queryKey: userFollowKeys.followingIds(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []
      const repository = new SupabaseUserFollowRepository()
      return repository.getFollowingIds(userId)
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })
}

// 팔로우 상태 확인
export function useIsFollowing(followerId: string | null, followingId: string | null) {
  return useQuery({
    queryKey: userFollowKeys.isFollowing(followerId ?? '', followingId ?? ''),
    queryFn: async () => {
      if (!followerId || !followingId) return false
      const repository = new SupabaseUserFollowRepository()
      const useCase = new CheckIsFollowing(repository)
      return useCase.execute(followerId, followingId)
    },
    enabled: !!followerId && !!followingId && followerId !== followingId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })
}

// 특정 사용자 프로필 + 팔로우 상태
export function useUserWithFollowStatus(targetUserId: string | null, currentUserId?: string) {
  return useQuery({
    queryKey: userFollowKeys.profile(targetUserId ?? ''),
    queryFn: async () => {
      if (!targetUserId) return null
      const repository = new SupabaseUserFollowRepository()
      return repository.getUserWithFollowStatus(targetUserId, currentUserId)
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })
}

// 팔로우
export function useFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
    }: {
      followerId: string
      followingId: string
    }) => {
      const repository = new SupabaseUserFollowRepository()
      const useCase = new FollowUser(repository)
      return useCase.execute(followerId, followingId)
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.following(variables.followerId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.followers(variables.followingId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.followingIds(variables.followerId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.isFollowing(variables.followerId, variables.followingId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.profile(variables.followingId),
      })
    },
  })
}

// 언팔로우
export function useUnfollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      followerId,
      followingId,
    }: {
      followerId: string
      followingId: string
    }) => {
      const repository = new SupabaseUserFollowRepository()
      const useCase = new UnfollowUser(repository)
      return useCase.execute(followerId, followingId)
    },
    onSuccess: (_, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.following(variables.followerId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.followers(variables.followingId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.followingIds(variables.followerId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.isFollowing(variables.followerId, variables.followingId),
      })
      queryClient.invalidateQueries({
        queryKey: userFollowKeys.profile(variables.followingId),
      })
    },
  })
}

// 팔로우 토글 (편의 훅)
export function useToggleFollow() {
  const followMutation = useFollow()
  const unfollowMutation = useUnfollow()

  return {
    toggle: async (followerId: string, followingId: string, isCurrentlyFollowing: boolean) => {
      if (isCurrentlyFollowing) {
        await unfollowMutation.mutateAsync({ followerId, followingId })
        return false
      } else {
        await followMutation.mutateAsync({ followerId, followingId })
        return true
      }
    },
    isLoading: followMutation.isPending || unfollowMutation.isPending,
  }
}

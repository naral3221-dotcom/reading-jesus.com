/**
 * IUserFollowRepository
 * 팔로우 관계 Repository 인터페이스
 */

import type { UserFollowProps, UserWithFollowStatus } from '../entities/UserFollow'

export interface GetFollowersOptions {
  userId: string
  limit?: number
  offset?: number
  currentUserId?: string // 맞팔로우 상태 확인용
}

export interface GetFollowingOptions {
  userId: string
  limit?: number
  offset?: number
  currentUserId?: string
}

export interface GetSuggestedUsersOptions {
  currentUserId: string
  churchId?: string | null
  limit?: number
}

export interface IUserFollowRepository {
  // 팔로우/언팔로우
  follow(followerId: string, followingId: string): Promise<UserFollowProps>
  unfollow(followerId: string, followingId: string): Promise<void>

  // 팔로우 상태 확인
  isFollowing(followerId: string, followingId: string): Promise<boolean>

  // 팔로워/팔로잉 목록 조회
  getFollowers(options: GetFollowersOptions): Promise<UserWithFollowStatus[]>
  getFollowing(options: GetFollowingOptions): Promise<UserWithFollowStatus[]>

  // 팔로워/팔로잉 ID 목록 조회 (피드 조회용)
  getFollowingIds(userId: string): Promise<string[]>

  // 카운트
  getFollowersCount(userId: string): Promise<number>
  getFollowingCount(userId: string): Promise<number>

  // 특정 사용자의 프로필 + 팔로우 상태
  getUserWithFollowStatus(targetUserId: string, currentUserId?: string): Promise<UserWithFollowStatus | null>

  // 추천 사용자 조회 (같은 교회 우선, 이미 팔로우 중인 사용자 제외)
  getSuggestedUsers(options: GetSuggestedUsersOptions): Promise<UserWithFollowStatus[]>
}

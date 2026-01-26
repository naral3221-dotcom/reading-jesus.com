/**
 * UserFollow Entity
 * 팔로우 관계 도메인 엔티티
 */

export interface UserFollowProps {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
  // 조인 데이터
  followerProfile?: {
    nickname: string
    avatarUrl: string | null
  } | null
  followingProfile?: {
    nickname: string
    avatarUrl: string | null
  } | null
}

export interface UserWithFollowStatus {
  id: string
  nickname: string
  avatarUrl: string | null
  followersCount: number
  followingCount: number
  isFollowing: boolean // 현재 사용자가 이 사용자를 팔로우하고 있는지
  isFollowedBy: boolean // 이 사용자가 현재 사용자를 팔로우하고 있는지
}

export class UserFollow {
  private props: UserFollowProps

  constructor(props: UserFollowProps) {
    this.props = props
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get followerId(): string {
    return this.props.followerId
  }

  get followingId(): string {
    return this.props.followingId
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get followerProfile() {
    return this.props.followerProfile
  }

  get followingProfile() {
    return this.props.followingProfile
  }

  // Factory method
  static create(followerId: string, followingId: string): Omit<UserFollowProps, 'id' | 'createdAt'> {
    if (followerId === followingId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다')
    }
    return {
      followerId,
      followingId,
    }
  }

  toProps(): UserFollowProps {
    return { ...this.props }
  }
}

// Utility functions
export function isFollowing(follows: UserFollowProps[], userId: string, targetUserId: string): boolean {
  return follows.some(f => f.followerId === userId && f.followingId === targetUserId)
}

export function getFollowersCount(follows: UserFollowProps[], userId: string): number {
  return follows.filter(f => f.followingId === userId).length
}

export function getFollowingCount(follows: UserFollowProps[], userId: string): number {
  return follows.filter(f => f.followerId === userId).length
}

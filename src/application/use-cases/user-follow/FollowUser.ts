/**
 * FollowUser Use Case
 * 사용자 팔로우
 */

import type { IUserFollowRepository } from '@/domain/repositories/IUserFollowRepository'
import type { UserFollowProps } from '@/domain/entities/UserFollow'

export class FollowUser {
  constructor(private repository: IUserFollowRepository) {}

  async execute(followerId: string, followingId: string): Promise<UserFollowProps> {
    if (followerId === followingId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다')
    }

    return this.repository.follow(followerId, followingId)
  }
}

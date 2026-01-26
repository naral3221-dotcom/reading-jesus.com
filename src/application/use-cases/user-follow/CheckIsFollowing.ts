/**
 * CheckIsFollowing Use Case
 * 팔로우 상태 확인
 */

import type { IUserFollowRepository } from '@/domain/repositories/IUserFollowRepository'

export class CheckIsFollowing {
  constructor(private repository: IUserFollowRepository) {}

  async execute(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      return false
    }

    return this.repository.isFollowing(followerId, followingId)
  }
}

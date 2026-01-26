/**
 * UnfollowUser Use Case
 * 사용자 언팔로우
 */

import type { IUserFollowRepository } from '@/domain/repositories/IUserFollowRepository'

export class UnfollowUser {
  constructor(private repository: IUserFollowRepository) {}

  async execute(followerId: string, followingId: string): Promise<void> {
    return this.repository.unfollow(followerId, followingId)
  }
}

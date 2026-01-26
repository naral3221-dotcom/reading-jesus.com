/**
 * GetFollowing Use Case
 * 팔로잉 목록 조회
 */

import type { IUserFollowRepository, GetFollowingOptions } from '@/domain/repositories/IUserFollowRepository'
import type { UserWithFollowStatus } from '@/domain/entities/UserFollow'

export class GetFollowing {
  constructor(private repository: IUserFollowRepository) {}

  async execute(options: GetFollowingOptions): Promise<UserWithFollowStatus[]> {
    return this.repository.getFollowing(options)
  }
}

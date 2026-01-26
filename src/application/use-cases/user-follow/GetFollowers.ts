/**
 * GetFollowers Use Case
 * 팔로워 목록 조회
 */

import type { IUserFollowRepository, GetFollowersOptions } from '@/domain/repositories/IUserFollowRepository'
import type { UserWithFollowStatus } from '@/domain/entities/UserFollow'

export class GetFollowers {
  constructor(private repository: IUserFollowRepository) {}

  async execute(options: GetFollowersOptions): Promise<UserWithFollowStatus[]> {
    return this.repository.getFollowers(options)
  }
}

/**
 * GetCurrentUser Use Case
 *
 * 현재 로그인한 사용자 정보를 조회하는 Use Case.
 */

import { User } from '@/domain/entities/User'
import { Church } from '@/domain/entities/Church'
import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { IChurchRepository } from '@/domain/repositories/IChurchRepository'

export interface GetCurrentUserOutput {
  user: User | null
  church: Church | null
  error: string | null
}

export class GetCurrentUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly churchRepository: IChurchRepository
  ) {}

  async execute(): Promise<GetCurrentUserOutput> {
    try {
      const user = await this.userRepository.getCurrentUser()

      if (!user) {
        return { user: null, church: null, error: null }
      }

      let church: Church | null = null
      if (user.churchId) {
        church = await this.churchRepository.findById(user.churchId)
      }

      return { user, church, error: null }
    } catch (error) {
      return {
        user: null,
        church: null,
        error: error instanceof Error ? error.message : '사용자 정보 조회 중 오류가 발생했습니다',
      }
    }
  }
}

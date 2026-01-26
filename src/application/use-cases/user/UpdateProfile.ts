/**
 * UpdateProfile Use Case
 *
 * 사용자 프로필을 업데이트하는 Use Case.
 */

import { User } from '@/domain/entities/User'
import { IUserRepository } from '@/domain/repositories/IUserRepository'

export interface UpdateProfileInput {
  userId: string
  nickname?: string
  avatarUrl?: string | null
  hasCompletedOnboarding?: boolean
}

export interface UpdateProfileOutput {
  user: User | null
  error: string | null
}

export class UpdateProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
    try {
      // 1. 사용자 조회
      const user = await this.userRepository.findById(input.userId)
      if (!user) {
        return { user: null, error: '사용자를 찾을 수 없습니다' }
      }

      // 2. 닉네임 업데이트
      if (input.nickname !== undefined) {
        await this.userRepository.updateNickname(input.userId, input.nickname)
      }

      // 3. 아바타 업데이트
      if (input.avatarUrl !== undefined) {
        await this.userRepository.updateAvatarUrl(input.userId, input.avatarUrl)
      }

      // 4. 온보딩 상태 업데이트
      if (input.hasCompletedOnboarding !== undefined) {
        await this.userRepository.updateOnboardingStatus(input.userId, input.hasCompletedOnboarding)
      }

      // 5. 업데이트된 사용자 정보 조회
      const updatedUser = await this.userRepository.findById(input.userId)

      return { user: updatedUser, error: null }
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : '프로필 업데이트 중 오류가 발생했습니다',
      }
    }
  }
}

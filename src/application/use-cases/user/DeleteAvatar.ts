/**
 * DeleteAvatar Use Case
 *
 * 사용자 아바타 이미지를 삭제하는 Use Case.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository'

export interface DeleteAvatarInput {
  userId: string
  avatarUrl: string
}

export interface DeleteAvatarOutput {
  success: boolean
  error: string | null
}

export class DeleteAvatar {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: DeleteAvatarInput): Promise<DeleteAvatarOutput> {
    try {
      const { userId, avatarUrl } = input

      // 1. 스토리지에서 이미지 삭제
      await this.userRepository.deleteAvatar(userId, avatarUrl)

      // 2. 프로필에서 URL 제거
      await this.userRepository.updateAvatarUrl(userId, null)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

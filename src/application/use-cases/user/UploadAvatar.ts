/**
 * UploadAvatar Use Case
 *
 * 사용자 아바타 이미지를 업로드하는 Use Case.
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UploadAvatarInput {
  userId: string
  file: File
  existingAvatarUrl?: string | null
}

export interface UploadAvatarOutput {
  avatarUrl: string | null
  error: string | null
}

export class UploadAvatar {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UploadAvatarInput): Promise<UploadAvatarOutput> {
    try {
      const { userId, file, existingAvatarUrl } = input

      // 1. 파일 타입 검증
      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          avatarUrl: null,
          error: '지원하지 않는 파일 형식입니다. JPG, PNG, WEBP, GIF 파일만 업로드 가능합니다.',
        }
      }

      // 2. 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        return {
          avatarUrl: null,
          error: '파일 크기는 5MB 이하여야 합니다.',
        }
      }

      // 3. 기존 이미지 삭제 (있는 경우)
      if (existingAvatarUrl) {
        await this.userRepository.deleteAvatar(userId, existingAvatarUrl)
      }

      // 4. 새 이미지 업로드
      const avatarUrl = await this.userRepository.uploadAvatar(userId, file)

      // 5. 프로필에 URL 저장
      await this.userRepository.updateAvatarUrl(userId, avatarUrl)

      return { avatarUrl, error: null }
    } catch (error) {
      return {
        avatarUrl: null,
        error: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다',
      }
    }
  }
}

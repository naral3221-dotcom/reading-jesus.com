/**
 * DeletePersonalMeditation Use Case
 * 개인 프로젝트 묵상 삭제
 */

import type { IPublicMeditationRepository } from '@/domain/repositories/IPublicMeditationRepository'

export interface DeletePersonalMeditationInput {
  id: string
  userId: string
}

export interface DeletePersonalMeditationOutput {
  success: boolean
  error: string | null
}

export class DeletePersonalMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: DeletePersonalMeditationInput): Promise<DeletePersonalMeditationOutput> {
    try {
      const { id, userId } = input

      // 기존 묵상 조회 (권한 확인)
      const existing = await this.repository.findById(id, userId)
      if (!existing) {
        throw new Error('묵상을 찾을 수 없습니다')
      }

      // 본인 확인
      if (existing.userId !== userId) {
        throw new Error('삭제 권한이 없습니다')
      }

      await this.repository.delete(id, userId)

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '묵상 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

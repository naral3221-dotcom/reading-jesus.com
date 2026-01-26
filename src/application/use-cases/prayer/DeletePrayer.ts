/**
 * DeletePrayer Use Case
 *
 * 기도제목을 삭제하는 Use Case.
 */

import { IPrayerRepository } from '@/domain/repositories/IPrayerRepository'

export interface DeletePrayerInput {
  id: string
  userId: string
}

export interface DeletePrayerOutput {
  success: boolean
  error: string | null
}

export class DeletePrayer {
  constructor(private readonly prayerRepository: IPrayerRepository) {}

  async execute(input: DeletePrayerInput): Promise<DeletePrayerOutput> {
    try {
      await this.prayerRepository.delete(input.id, input.userId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '기도제목 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

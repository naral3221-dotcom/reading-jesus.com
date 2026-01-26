/**
 * TogglePrayerSupport Use Case
 *
 * 기도제목에 함께 기도를 토글하는 Use Case.
 */

import { IPrayerRepository } from '@/domain/repositories/IPrayerRepository'

export interface TogglePrayerSupportInput {
  prayerId: string
  userId: string
}

export interface TogglePrayerSupportOutput {
  supported: boolean
  error: string | null
}

export class TogglePrayerSupport {
  constructor(private readonly prayerRepository: IPrayerRepository) {}

  async execute(input: TogglePrayerSupportInput): Promise<TogglePrayerSupportOutput> {
    try {
      const result = await this.prayerRepository.toggleSupport(input.prayerId, input.userId)

      return { supported: result.supported, error: null }
    } catch (error) {
      return {
        supported: false,
        error: error instanceof Error ? error.message : '함께 기도 처리 중 오류가 발생했습니다',
      }
    }
  }
}

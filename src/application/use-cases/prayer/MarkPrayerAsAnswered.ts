/**
 * MarkPrayerAsAnswered Use Case
 *
 * 기도제목을 응답됨으로 표시하는 Use Case.
 */

import { PrayerProps } from '@/domain/entities/Prayer'
import { IPrayerRepository } from '@/domain/repositories/IPrayerRepository'

export interface MarkPrayerAsAnsweredInput {
  id: string
  userId: string
}

export interface MarkPrayerAsAnsweredOutput {
  prayer: PrayerProps | null
  error: string | null
}

export class MarkPrayerAsAnswered {
  constructor(private readonly prayerRepository: IPrayerRepository) {}

  async execute(input: MarkPrayerAsAnsweredInput): Promise<MarkPrayerAsAnsweredOutput> {
    try {
      const prayer = await this.prayerRepository.markAsAnswered(input.id, input.userId)

      return { prayer, error: null }
    } catch (error) {
      return {
        prayer: null,
        error: error instanceof Error ? error.message : '응답 표시 중 오류가 발생했습니다',
      }
    }
  }
}

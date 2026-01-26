/**
 * CalculateStreak Use Case
 *
 * 읽기 스트릭을 계산합니다.
 */

import { ReadingStreakProps } from '@/domain/entities/ReadingCheck'
import { IReadingCheckRepository, ReadingCheckSearchParams } from '@/domain/repositories/IReadingCheckRepository'

export type CalculateStreakInput = ReadingCheckSearchParams

export interface CalculateStreakOutput {
  streak: ReadingStreakProps | null
  error: string | null
}

export class CalculateStreak {
  constructor(private readonly repository: IReadingCheckRepository) {}

  async execute(input: CalculateStreakInput): Promise<CalculateStreakOutput> {
    try {
      const streak = await this.repository.calculateStreak(input)

      return { streak, error: null }
    } catch (error) {
      return {
        streak: null,
        error: error instanceof Error ? error.message : '스트릭 계산 중 오류가 발생했습니다',
      }
    }
  }
}

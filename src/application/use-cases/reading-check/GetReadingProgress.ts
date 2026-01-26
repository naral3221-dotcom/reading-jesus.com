/**
 * GetReadingProgress Use Case
 *
 * 읽기 진행률 통계를 조회합니다.
 */

import { ReadingProgressProps } from '@/domain/entities/ReadingCheck'
import { IReadingCheckRepository, ReadingCheckSearchParams } from '@/domain/repositories/IReadingCheckRepository'

export interface GetReadingProgressInput extends ReadingCheckSearchParams {
  totalDays?: number
}

export interface GetReadingProgressOutput {
  progress: ReadingProgressProps | null
  error: string | null
}

export class GetReadingProgress {
  constructor(private readonly repository: IReadingCheckRepository) {}

  async execute(input: GetReadingProgressInput): Promise<GetReadingProgressOutput> {
    try {
      const progress = await this.repository.getProgress(input, input.totalDays)

      return { progress, error: null }
    } catch (error) {
      return {
        progress: null,
        error: error instanceof Error ? error.message : '진행률 조회 중 오류가 발생했습니다',
      }
    }
  }
}

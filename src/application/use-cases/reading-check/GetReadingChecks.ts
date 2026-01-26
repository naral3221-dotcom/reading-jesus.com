/**
 * GetReadingChecks Use Case
 *
 * 사용자의 읽음 체크 목록을 조회합니다.
 */

import { ReadingCheckProps } from '@/domain/entities/ReadingCheck'
import { IReadingCheckRepository, ReadingCheckSearchParams } from '@/domain/repositories/IReadingCheckRepository'

export type GetReadingChecksInput = ReadingCheckSearchParams

export interface GetReadingChecksOutput {
  checks: ReadingCheckProps[]
  checkedDayNumbers: number[]
  error: string | null
}

export class GetReadingChecks {
  constructor(private readonly repository: IReadingCheckRepository) {}

  async execute(input: GetReadingChecksInput): Promise<GetReadingChecksOutput> {
    try {
      const checks = await this.repository.findByUser(input)
      const checkedDayNumbers = checks.map(c => c.dayNumber)

      return { checks, checkedDayNumbers, error: null }
    } catch (error) {
      return {
        checks: [],
        checkedDayNumbers: [],
        error: error instanceof Error ? error.message : '읽음 체크 조회 중 오류가 발생했습니다',
      }
    }
  }
}

/**
 * GetUserDailyReadings Use Case
 *
 * 사용자의 오늘 읽기 목록을 조회합니다.
 * 모든 그룹/교회의 플랜을 통합하여 반환합니다.
 */

import { IUserDailyReadingRepository } from '@/domain/repositories/IUserDailyReadingRepository'
import { UserDailyReading } from '@/domain/entities/UserDailyReading'

export interface GetUserDailyReadingsInput {
  userId: string
}

export interface GetUserDailyReadingsOutput {
  readings: UserDailyReading[]
  error: string | null
}

export class GetUserDailyReadings {
  constructor(private readonly repository: IUserDailyReadingRepository) {}

  async execute(input: GetUserDailyReadingsInput): Promise<GetUserDailyReadingsOutput> {
    try {
      if (!input.userId) {
        return {
          readings: [],
          error: null,
        }
      }

      const readings = await this.repository.getUserDailyReadings(input.userId)

      return {
        readings,
        error: null,
      }
    } catch (error) {
      console.error('GetUserDailyReadings error:', error)
      return {
        readings: [],
        error: error instanceof Error ? error.message : '읽기 목록 조회 중 오류가 발생했습니다.',
      }
    }
  }
}

/**
 * GetAllGroupReadings Use Case
 *
 * 사용자의 모든 그룹에 대한 읽기 데이터를 조회합니다.
 */

import type { IReadingCheckRepository } from '@/domain/repositories/IReadingCheckRepository'
import type { ReadingCheckProps } from '@/domain/entities/ReadingCheck'

export interface GetAllGroupReadingsInput {
  userId: string
  groupIds: string[]
}

export interface GroupReadingData {
  groupId: string
  groupName: string
  readings: ReadingCheckProps[]
}

export interface GetAllGroupReadingsOutput {
  groupReadings: GroupReadingData[]
  error: string | null
}

export class GetAllGroupReadings {
  constructor(private readonly readingCheckRepository: IReadingCheckRepository) {}

  async execute(input: GetAllGroupReadingsInput): Promise<GetAllGroupReadingsOutput> {
    try {
      const groupReadings = await this.readingCheckRepository.findAllGroupReadings(
        input.userId,
        input.groupIds
      )

      return {
        groupReadings,
        error: null,
      }
    } catch (error) {
      return {
        groupReadings: [],
        error: error instanceof Error ? error.message : '읽기 데이터 조회 중 오류가 발생했습니다',
      }
    }
  }
}

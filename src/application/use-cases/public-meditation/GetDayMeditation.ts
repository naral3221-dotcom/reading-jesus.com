/**
 * GetDayMeditation Use Case
 * 특정 프로젝트의 특정 Day 묵상 조회
 */

import type { IPublicMeditationRepository } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation'

export interface GetDayMeditationInput {
  projectId: string
  dayNumber: number
  currentUserId?: string
}

export interface GetDayMeditationOutput {
  meditation: PublicMeditationProps | null
  error: string | null
}

export class GetDayMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: GetDayMeditationInput): Promise<GetDayMeditationOutput> {
    try {
      const { projectId, dayNumber, currentUserId } = input

      if (dayNumber < 1 || dayNumber > 365) {
        throw new Error('유효하지 않은 일차입니다 (1-365)')
      }

      const meditation = await this.repository.findByProjectDay(
        projectId,
        dayNumber,
        currentUserId
      )

      return {
        meditation,
        error: null,
      }
    } catch (error) {
      return {
        meditation: null,
        error: error instanceof Error ? error.message : '묵상 조회 중 오류가 발생했습니다',
      }
    }
  }
}

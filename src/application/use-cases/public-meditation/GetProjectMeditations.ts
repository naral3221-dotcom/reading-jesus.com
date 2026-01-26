/**
 * GetProjectMeditations Use Case
 * 개인 프로젝트별 묵상 목록 조회
 */

import type { IPublicMeditationRepository } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation'

export interface GetProjectMeditationsInput {
  projectId: string
  limit?: number
  offset?: number
  currentUserId?: string
}

export interface GetProjectMeditationsOutput {
  meditations: PublicMeditationProps[]
  total: number
  error: string | null
}

export class GetProjectMeditations {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: GetProjectMeditationsInput): Promise<GetProjectMeditationsOutput> {
    try {
      const { projectId, limit = 20, offset = 0, currentUserId } = input

      // 프로젝트별 묵상 조회
      const meditations = await this.repository.findByProjectId(projectId, {
        limit,
        offset,
        currentUserId,
      })

      // 프로젝트별 총 묵상 개수
      const total = await this.repository.countByProject(projectId)

      return {
        meditations,
        total,
        error: null,
      }
    } catch (error) {
      return {
        meditations: [],
        total: 0,
        error: error instanceof Error ? error.message : '묵상 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

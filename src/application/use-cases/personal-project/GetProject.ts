/**
 * GetProject Use Case
 *
 * 개인 프로젝트 상세 조회
 */

import type { IPersonalProjectRepository } from '@/domain/repositories/IPersonalProjectRepository'
import type { PersonalProjectWithStats } from '@/domain/entities/PersonalProject'

export interface GetProjectOutput {
  project: PersonalProjectWithStats | null
  error: string | null
}

export class GetProject {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(id: string, userId: string): Promise<GetProjectOutput> {
    try {
      const project = await this.projectRepository.findById(id, userId)
      return { project, error: null }
    } catch (error) {
      return {
        project: null,
        error: error instanceof Error ? error.message : '프로젝트 조회 중 오류가 발생했습니다',
      }
    }
  }
}

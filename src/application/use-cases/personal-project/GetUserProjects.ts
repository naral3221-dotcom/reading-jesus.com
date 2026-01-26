/**
 * GetUserProjects Use Case
 *
 * 사용자의 개인 프로젝트 목록 조회
 */

import type { IPersonalProjectRepository, PersonalProjectSearchParams } from '@/domain/repositories/IPersonalProjectRepository'
import type { PersonalProjectWithStats } from '@/domain/entities/PersonalProject'

export interface GetUserProjectsOutput {
  projects: PersonalProjectWithStats[]
  error: string | null
}

export class GetUserProjects {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(params: PersonalProjectSearchParams): Promise<GetUserProjectsOutput> {
    try {
      const projects = await this.projectRepository.findByUserId(params)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: error instanceof Error ? error.message : '프로젝트 조회 중 오류가 발생했습니다',
      }
    }
  }
}

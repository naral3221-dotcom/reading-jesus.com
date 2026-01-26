/**
 * CreateProject Use Case
 *
 * 개인 프로젝트 생성
 */

import type { IPersonalProjectRepository } from '@/domain/repositories/IPersonalProjectRepository'
import type {
  PersonalProjectProps,
  CreatePersonalProjectInput,
} from '@/domain/entities/PersonalProject'

export interface CreateProjectOutput {
  project: PersonalProjectProps | null
  error: string | null
}

export class CreateProject {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(input: CreatePersonalProjectInput): Promise<CreateProjectOutput> {
    try {
      // 유효성 검증
      if (!input.name || input.name.trim().length === 0) {
        return { project: null, error: '프로젝트 이름을 입력해주세요' }
      }

      if (input.name.length > 50) {
        return { project: null, error: '프로젝트 이름은 50자 이내로 입력해주세요' }
      }

      const project = await this.projectRepository.create(input)
      return { project, error: null }
    } catch (error) {
      return {
        project: null,
        error: error instanceof Error ? error.message : '프로젝트 생성 중 오류가 발생했습니다',
      }
    }
  }
}

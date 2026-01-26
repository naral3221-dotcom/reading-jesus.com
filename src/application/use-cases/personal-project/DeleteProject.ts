/**
 * DeleteProject Use Case
 *
 * 개인 프로젝트 삭제
 */

import type { IPersonalProjectRepository } from '@/domain/repositories/IPersonalProjectRepository'

export interface DeleteProjectOutput {
  success: boolean
  error: string | null
}

export class DeleteProject {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(id: string, userId: string): Promise<DeleteProjectOutput> {
    try {
      await this.projectRepository.delete(id, userId)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '프로젝트 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

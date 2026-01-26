/**
 * GetProjectChecks Use Case
 *
 * 개인 프로젝트 체크 목록 조회
 */

import type { IPersonalProjectRepository } from '@/domain/repositories/IPersonalProjectRepository'

export interface GetProjectChecksOutput {
  checkedDays: number[]
  error: string | null
}

export class GetProjectChecks {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(projectId: string): Promise<GetProjectChecksOutput> {
    try {
      const checkedDays = await this.projectRepository.getCheckedDays(projectId)
      return { checkedDays, error: null }
    } catch (error) {
      return {
        checkedDays: [],
        error: error instanceof Error ? error.message : '체크 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

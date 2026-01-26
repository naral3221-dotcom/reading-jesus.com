/**
 * GetAllGroups Use Case
 *
 * 그룹 목록 조회 (관리자용)
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { GroupListItemProps, PaginatedResult, AdminSearchParams } from '@/domain/entities/SystemAdmin'

export interface GetAllGroupsOutput {
  result: PaginatedResult<GroupListItemProps> | null
  error: string | null
}

export class GetAllGroups {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(params: AdminSearchParams): Promise<GetAllGroupsOutput> {
    try {
      const result = await this.adminRepository.getGroups(params)
      return { result, error: null }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : '그룹 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

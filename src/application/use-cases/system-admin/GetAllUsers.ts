/**
 * GetAllUsers Use Case
 *
 * 사용자 목록 조회 (관리자용)
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { UserListItemProps, PaginatedResult, AdminSearchParams } from '@/domain/entities/SystemAdmin'

export interface GetAllUsersOutput {
  result: PaginatedResult<UserListItemProps> | null
  error: string | null
}

export class GetAllUsers {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(params: AdminSearchParams): Promise<GetAllUsersOutput> {
    try {
      const result = await this.adminRepository.getUsers(params)
      return { result, error: null }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : '사용자 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

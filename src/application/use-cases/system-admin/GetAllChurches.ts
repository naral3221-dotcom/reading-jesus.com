/**
 * GetAllChurches Use Case
 *
 * 교회 목록 조회 (관리자용)
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { ChurchListItemProps, PaginatedResult, AdminSearchParams } from '@/domain/entities/SystemAdmin'

export interface GetAllChurchesOutput {
  result: PaginatedResult<ChurchListItemProps> | null
  error: string | null
}

export class GetAllChurches {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(params: AdminSearchParams): Promise<GetAllChurchesOutput> {
    try {
      const result = await this.adminRepository.getChurches(params)
      return { result, error: null }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : '교회 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

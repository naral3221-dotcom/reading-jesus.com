/**
 * GetChurchByCode Use Case
 *
 * 교회 코드로 교회 정보 조회
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface GetChurchByCodeOutput {
  church: {
    id: string
    name: string
    code: string
    adminToken: string | null
  } | null
  error: string | null
}

export class GetChurchByCode {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(code: string): Promise<GetChurchByCodeOutput> {
    try {
      if (!code) {
        return { church: null, error: '교회 코드가 필요합니다' }
      }

      const church = await this.adminRepository.getChurchByCode(code)
      if (!church) {
        return { church: null, error: '교회를 찾을 수 없습니다' }
      }

      return { church, error: null }
    } catch (error) {
      return {
        church: null,
        error: error instanceof Error ? error.message : '교회 정보 조회 중 오류가 발생했습니다',
      }
    }
  }
}

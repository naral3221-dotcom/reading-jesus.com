/**
 * GetChurchAdmins Use Case
 *
 * 교회별 관리자 목록 조회
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'
import type { ChurchAdminProps } from '@/domain/entities/ChurchAdmin'

export interface GetChurchAdminsOutput {
  admins: ChurchAdminProps[]
  error: string | null
}

export class GetChurchAdmins {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(churchId: string): Promise<GetChurchAdminsOutput> {
    try {
      if (!churchId) {
        return { admins: [], error: '교회 ID가 필요합니다' }
      }

      const admins = await this.adminRepository.findByChurchId(churchId)
      return { admins, error: null }
    } catch (error) {
      return {
        admins: [],
        error: error instanceof Error ? error.message : '관리자 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}

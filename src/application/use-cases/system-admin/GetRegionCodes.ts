/**
 * GetRegionCodes Use Case
 *
 * 지역 코드 목록 조회
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { RegionCodeProps } from '@/domain/entities/SystemAdmin'

export interface GetRegionCodesOutput {
  regions: RegionCodeProps[]
  error: string | null
}

export class GetRegionCodes {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(): Promise<GetRegionCodesOutput> {
    try {
      const regions = await this.adminRepository.getRegionCodes()
      return { regions, error: null }
    } catch (error) {
      return {
        regions: [],
        error: error instanceof Error ? error.message : '지역 코드 조회 중 오류가 발생했습니다',
      }
    }
  }
}

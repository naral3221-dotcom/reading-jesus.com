/**
 * GetSystemStats Use Case
 *
 * 시스템 전체 통계 조회
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { SystemStatsProps } from '@/domain/entities/SystemAdmin'

export interface GetSystemStatsOutput {
  stats: SystemStatsProps | null
  error: string | null
}

export class GetSystemStats {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(): Promise<GetSystemStatsOutput> {
    try {
      const stats = await this.adminRepository.getSystemStats()
      return { stats, error: null }
    } catch (error) {
      return {
        stats: null,
        error: error instanceof Error ? error.message : '통계 조회 중 오류가 발생했습니다',
      }
    }
  }
}

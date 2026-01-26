/**
 * ToggleAdminActive Use Case
 *
 * 교회 관리자 활성화/비활성화 토글
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface ToggleAdminActiveOutput {
  isActive: boolean
  error: string | null
}

export class ToggleAdminActive {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(id: string): Promise<ToggleAdminActiveOutput> {
    try {
      if (!id) {
        return { isActive: false, error: '관리자 ID가 필요합니다' }
      }

      const isActive = await this.adminRepository.toggleActive(id)
      return { isActive, error: null }
    } catch (error) {
      return {
        isActive: false,
        error: error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다',
      }
    }
  }
}

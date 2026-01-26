/**
 * DeleteChurch Use Case
 *
 * 교회 삭제 (관리자용)
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'

export interface DeleteChurchOutput {
  success: boolean
  error: string | null
}

export class DeleteChurch {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(id: string): Promise<DeleteChurchOutput> {
    try {
      if (!id) {
        return { success: false, error: '교회 ID가 필요합니다' }
      }

      await this.adminRepository.deleteChurch(id)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '교회 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

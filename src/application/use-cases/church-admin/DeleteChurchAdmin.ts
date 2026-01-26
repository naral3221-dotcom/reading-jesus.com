/**
 * DeleteChurchAdmin Use Case
 *
 * 교회 관리자 삭제
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface DeleteChurchAdminOutput {
  success: boolean
  error: string | null
}

export class DeleteChurchAdmin {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(id: string): Promise<DeleteChurchAdminOutput> {
    try {
      if (!id) {
        return { success: false, error: '관리자 ID가 필요합니다' }
      }

      await this.adminRepository.delete(id)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '관리자 삭제 중 오류가 발생했습니다',
      }
    }
  }
}

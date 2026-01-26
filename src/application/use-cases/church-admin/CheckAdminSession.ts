/**
 * CheckAdminSession Use Case
 *
 * 현재 사용자가 특정 교회의 관리자인지 확인
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface CheckAdminSessionOutput {
  isAdmin: boolean
  error: string | null
}

export class CheckAdminSession {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(userId: string, churchId: string): Promise<CheckAdminSessionOutput> {
    try {
      if (!userId || !churchId) {
        return { isAdmin: false, error: null }
      }

      const isAdmin = await this.adminRepository.isAdminOfChurch(userId, churchId)
      return { isAdmin, error: null }
    } catch (error) {
      return {
        isAdmin: false,
        error: error instanceof Error ? error.message : '세션 확인 중 오류가 발생했습니다',
      }
    }
  }
}

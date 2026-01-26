/**
 * SendPasswordResetEmail Use Case
 *
 * 교회 관리자 비밀번호 재설정 이메일 발송
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface SendPasswordResetEmailOutput {
  success: boolean
  error: string | null
}

export class SendPasswordResetEmail {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(email: string): Promise<SendPasswordResetEmailOutput> {
    try {
      // 이메일 유효성 검증
      if (!email || !email.includes('@')) {
        return { success: false, error: '유효한 이메일을 입력해주세요' }
      }

      await this.adminRepository.sendPasswordResetEmail(email)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다',
      }
    }
  }
}

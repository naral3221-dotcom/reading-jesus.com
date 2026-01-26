/**
 * AuthenticateWithToken Use Case
 *
 * 교회 관리자 토큰 인증 (레거시)
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'
import type { ChurchAdminAuthResult } from '@/domain/entities/ChurchAdmin'

export interface AuthenticateWithTokenInput {
  token: string
  churchCode: string
}

export class AuthenticateWithToken {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(input: AuthenticateWithTokenInput): Promise<ChurchAdminAuthResult> {
    const { token, churchCode } = input

    // 입력 유효성 검증
    if (!token || !token.trim()) {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '관리자 토큰을 입력해주세요',
      }
    }

    if (!churchCode) {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '교회 코드가 필요합니다',
      }
    }

    return await this.adminRepository.authenticateWithToken(token, churchCode)
  }
}

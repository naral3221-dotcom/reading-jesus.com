/**
 * AuthenticateChurchAdmin Use Case
 *
 * 교회 관리자 인증 (이메일/비밀번호)
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'
import type { ChurchAdminAuthResult } from '@/domain/entities/ChurchAdmin'

export interface AuthenticateChurchAdminInput {
  email: string
  password: string
  churchCode: string
}

export class AuthenticateChurchAdmin {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(input: AuthenticateChurchAdminInput): Promise<ChurchAdminAuthResult> {
    const { email, password, churchCode } = input

    // 입력 유효성 검증
    if (!email || !email.includes('@')) {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '유효한 이메일을 입력해주세요',
      }
    }

    if (!password) {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '비밀번호를 입력해주세요',
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

    return await this.adminRepository.authenticateWithEmail(email, password, churchCode)
  }
}

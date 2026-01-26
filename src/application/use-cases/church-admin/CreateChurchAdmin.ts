/**
 * CreateChurchAdmin Use Case
 *
 * 교회 관리자 생성
 */

import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'
import type { ChurchAdminProps, CreateChurchAdminInput } from '@/domain/entities/ChurchAdmin'

export interface CreateChurchAdminOutput {
  admin: ChurchAdminProps | null
  error: string | null
}

export class CreateChurchAdmin {
  constructor(private readonly adminRepository: IChurchAdminRepository) {}

  async execute(input: CreateChurchAdminInput): Promise<CreateChurchAdminOutput> {
    try {
      // 이메일 유효성 검증
      if (!input.email || !input.email.includes('@')) {
        return { admin: null, error: '유효한 이메일을 입력해주세요' }
      }

      // 비밀번호 유효성 검증
      if (!input.password || input.password.length < 6) {
        return { admin: null, error: '비밀번호는 6자 이상이어야 합니다' }
      }

      // 교회 ID 필수
      if (!input.churchId) {
        return { admin: null, error: '교회 ID가 필요합니다' }
      }

      const admin = await this.adminRepository.create(input)
      return { admin, error: null }
    } catch (error) {
      return {
        admin: null,
        error: error instanceof Error ? error.message : '관리자 생성 중 오류가 발생했습니다',
      }
    }
  }
}

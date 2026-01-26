/**
 * CreateChurch Use Case
 *
 * 교회 생성 (관리자용)
 */

import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type { ChurchListItemProps, CreateChurchInput } from '@/domain/entities/SystemAdmin'

export interface CreateChurchOutput {
  church: ChurchListItemProps | null
  error: string | null
}

export class CreateChurch {
  constructor(private readonly adminRepository: ISystemAdminRepository) {}

  async execute(input: CreateChurchInput): Promise<CreateChurchOutput> {
    try {
      // 유효성 검증
      if (!input.name || input.name.trim().length === 0) {
        return { church: null, error: '교회 이름을 입력해주세요' }
      }

      if (!input.regionCode) {
        return { church: null, error: '지역을 선택해주세요' }
      }

      // 관리자 계정 생성 시 이메일/비밀번호 검증
      if (input.adminEmail) {
        if (!input.adminEmail.includes('@')) {
          return { church: null, error: '유효한 이메일 주소를 입력해주세요' }
        }
        if (!input.adminPassword || input.adminPassword.length < 6) {
          return { church: null, error: '비밀번호는 6자 이상이어야 합니다' }
        }
      }

      const church = await this.adminRepository.createChurch(input)
      return { church, error: null }
    } catch (error) {
      return {
        church: null,
        error: error instanceof Error ? error.message : '교회 생성 중 오류가 발생했습니다',
      }
    }
  }
}

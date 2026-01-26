/**
 * RegisterChurch Use Case
 *
 * 새로운 교회를 등록하고 관리자 계정을 생성하는 Use Case.
 */

import { Church } from '@/domain/entities/Church'
import type { ChurchAdminProps } from '@/domain/entities/ChurchAdmin'
import type { IChurchRepository } from '@/domain/repositories/IChurchRepository'
import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'

export interface RegisterChurchInput {
  name: string
  regionCode: string
  denomination: string
  address: string
  adminEmail: string
  adminPassword: string
}

export interface RegisterChurchOutput {
  church: Church | null
  admin: ChurchAdminProps | null
  error: string | null
}

export class RegisterChurch {
  constructor(
    private readonly churchRepository: IChurchRepository,
    private readonly churchAdminRepository: IChurchAdminRepository
  ) {}

  async execute(input: RegisterChurchInput): Promise<RegisterChurchOutput> {
    try {
      // 1. 입력값 검증
      if (!input.name || input.name.trim().length < 2) {
        return { church: null, admin: null, error: '교회 이름은 2자 이상이어야 합니다' }
      }

      if (!input.regionCode) {
        return { church: null, admin: null, error: '지역을 선택해주세요' }
      }

      if (!input.denomination || input.denomination.trim().length < 2) {
        return { church: null, admin: null, error: '교단을 입력해주세요' }
      }

      if (!input.address || input.address.trim().length < 5) {
        return { church: null, admin: null, error: '주소를 입력해주세요 (최소 5자)' }
      }

      if (!input.adminEmail || !input.adminEmail.includes('@')) {
        return { church: null, admin: null, error: '올바른 이메일 주소를 입력해주세요' }
      }

      if (!input.adminPassword || input.adminPassword.length < 8) {
        return { church: null, admin: null, error: '비밀번호는 8자 이상이어야 합니다' }
      }

      // 2. 이메일 중복 체크
      const isEmailAvailable = await this.churchAdminRepository.isEmailAvailable(input.adminEmail)
      if (!isEmailAvailable) {
        return { church: null, admin: null, error: '이미 사용 중인 이메일입니다' }
      }

      // 3. 교회 엔티티 생성 (코드는 DB에서 자동 생성됨)
      const church = Church.create({
        id: crypto.randomUUID(),
        code: '', // DB 트리거에서 자동 생성
        name: input.name.trim(),
        denomination: input.denomination.trim(),
        address: input.address.trim(),
        regionCode: input.regionCode,
        writeToken: null,
        adminToken: null,
        isActive: true,
        allowAnonymous: false,
        scheduleYear: null,
        scheduleStartDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // 4. 교회 저장
      const savedChurch = await this.churchRepository.save(church)

      // 5. 관리자 계정 생성
      const admin = await this.churchAdminRepository.create({
        email: input.adminEmail.toLowerCase(),
        password: input.adminPassword,
        churchId: savedChurch.id,
      })

      return { church: savedChurch, admin, error: null }
    } catch (error) {
      console.error('RegisterChurch error:', error)
      return {
        church: null,
        admin: null,
        error: error instanceof Error ? error.message : '교회 등록 중 오류가 발생했습니다',
      }
    }
  }
}
